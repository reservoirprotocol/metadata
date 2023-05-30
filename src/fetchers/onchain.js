import { defaultAbiCoder, solidityPack } from "ethers/lib/utils";
import { ethers } from "ethers";
import fetch from "node-fetch";
import slugify from "slugify";
import { parse } from "../parsers/onchain";
import { RequestWasThrottledError } from "./errors";

const FETCH_TIMEOUT = 30000;

const erc721Interface = new ethers.utils.Interface([
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
]);

const erc1155Interface = new ethers.utils.Interface([
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
]);

async function detectTokenStandard(contractAddress, rpcURL) {
  const provider = new ethers.providers.JsonRpcProvider(rpcURL);
  const contract = new ethers.Contract(
    contractAddress,
    [...erc721Interface.fragments, ...erc1155Interface.fragments],
    provider
  );

  try {
    const erc721Supported = await contract.supportsInterface("0x80ac58cd");
    const erc1155Supported = await contract.supportsInterface("0xd9b67a26");

    if (erc721Supported && !erc1155Supported) {
      return "ERC721";
    } else if (!erc721Supported && erc1155Supported) {
      return "ERC1155";
    } else if (erc721Supported && erc1155Supported) {
      return "Both";
    } else {
      return "Unknown";
    }
  } catch (error) {
    console.error("Error detecting token standard:", error);
    return "Unknown";
  }
}

const encodeTokenERC721 = (token) => {
  const iface = new ethers.utils.Interface([
    {
      name: "tokenURI",
      type: "function",
      stateMutability: "view",
      inputs: [
        {
          type: "uint256",
          name: "tokenId",
        },
      ],
    },
  ]);

  return {
    id: token.requestId,
    encodedTokenID: iface.encodeFunctionData("tokenURI", [token.tokenId]),
    contract: token.contract,
  };
};

const encodeTokenERC1155 = (token) => {
  const iface = new ethers.utils.Interface([
    {
      name: "uri",
      type: "function",
      stateMutability: "view",
      inputs: [
        {
          type: "uint256",
          name: "tokenId",
        },
      ],
    },
  ]);

  return {
    id: token.requestId,
    encodedTokenID: iface.encodeFunctionData("uri", [token.tokenId]),
    contract: token.contract,
  };
};

const createBatch = (encodedTokens) => {
  return encodedTokens.map((token) => {
    return {
      jsonrpc: "2.0",
      id: token.id,
      method: "eth_call",
      params: [
        {
          data: token.encodedTokenID,
          to: token.contract,
        },
        "latest",
      ],
    };
  });
};

const sendBatch = async (encodedTokens, RPC_URL) => {
  let response;
  try {
    response = await fetch(RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createBatch(encodedTokens)),
      timeout: FETCH_TIMEOUT,
      // TODO: add proxy support to avoid rate limiting
      // agent:
    });
    const body = await response.text();
    if (!response.ok) {
      return [
        null,
        {
          body: body,
          status: response.status,
        },
      ];
    }
    const json = JSON.parse(body);
    return [json, null];
  } catch (e) {
    return [
      null,
      {
        message: e.message,
        status: response?.status,
      },
    ];
  }
};

const getTokenMetadataFromURI = async (uri) => {
  try {
    if (uri.includes("ipfs://")) {
      uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    if (!uri.includes("http")) {
      return [null, "Invalid URL"];
    }

    const response = await fetch(uri, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: FETCH_TIMEOUT,
      // TODO: add proxy support to avoid rate limiting
      // agent:
    });

    if (!response.ok) {
      return [null, response.status];
    }

    const json = await response.json();
    return [json, null];
  } catch (e) {
    return [null, e.message];
  }
};

export const fetchTokens = async (chainId, tokens) => {
  // TODO: Add support for other chains via RPC_URL
  if (tokens.length === 0) return [];
  if (!Array.isArray(tokens)) tokens = [tokens];
  if (!process.env[`RPC_URL_${chainId}`]) throw new Error("Missing RPC_URL for chain");

  // Detect token standard, batch contract addresses together to call once per contract
  const contracts = [];
  tokens.forEach((token) => {
    if (!contracts.includes(token.contract)) {
      contracts.push(token.contract);
    }
  });

  const standards = await Promise.all(
    contracts.map(async (contract) => {
      const standard = await detectTokenStandard(contract, process.env[`RPC_URL_${chainId}`]);
      return {
        contract,
        standard,
      };
    })
  );

  // Map the token to the standard
  tokens.forEach((token) => {
    const standard = standards.find((standard) => standard.contract === token.contract);
    token.standard = standard.standard;
  });

  // We need to have some type of hash map to map the tokenid + contract to the tokenURI
  const idToToken = {};
  tokens.forEach((token) => {
    const randomInt = Math.floor(Math.random() * 100000);
    idToToken[randomInt] = token;
    token.requestId = randomInt;
  });

  const RPC_URL = process.env[`RPC_URL_${chainId}`];
  const encodedTokens = tokens.map((token) => {
    if (token.standard === "ERC721") {
      return encodeTokenERC721(token);
    } else if (token.standard === "ERC1155") {
      return encodeTokenERC1155(token);
    } else {
      return null;
    }
  });
  const [batch, error] = await sendBatch(encodedTokens, RPC_URL);
  if (error) {
    if (error.status === 429) {
      throw new RequestWasThrottledError(error.message, 10);
    }
    return tokens.map((token) => {
      return {
        contract: token.contract,
        token_id: token.tokenId,
        error: "Unable to fetch tokenURI from contract",
      };
    });
  }

  const resolvedMetadata = await Promise.all(
    batch.map(async (token) => {
      try {
        const uri = defaultAbiCoder.decode(["string"], token.result)[0];
        const [metadata, error] = await getTokenMetadataFromURI(uri);
        if (error) {
          if (error === 429) {
            throw new RequestWasThrottledError(error.message, 10);
          }
          return {
            contract: idToToken[token.id].contract,
            token_id: idToToken[token.id].tokenId,
            error: "Unable to fetch metadata from URI",
          };
        }

        return {
          ...metadata,
          contract: idToToken[token.id].contract,
          token_id: idToToken[token.id].tokenId,
        };
      } catch (e) {
        return {
          contract: idToToken[token.id].contract,
          token_id: idToToken[token.id].tokenId,
          error: "Unable to decode metadata from URI",
        };
      }
    })
  );

  return resolvedMetadata.map((token) => {
    return parse(token);
  });
};

export const fetchContractTokens = async (chainId, contract, from, to) => {};

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  const [tokenMetadata] = await fetchTokens(chainId, { contract, tokenId });
  const collectionName = tokenMetadata.name ? tokenMetadata.name.split(" ")[0].trim() : "";
  return {
    id: contract,
    slug: slugify(collectionName, { lower: true }),
    name: collectionName,
    metadata: {
      description: tokenMetadata.description,
      imageUrl: tokenMetadata.imageUrl,
    },
    contract,
    tokenSetId: `contract:${contract}`,
  };
};
