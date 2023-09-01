import { defaultAbiCoder } from "ethers/lib/utils";
import { ethers } from "ethers";
import { parse, normalizeLink } from "../parsers/onchain";
import { RequestWasThrottledError } from "./errors";
import { supportedChains } from "../shared/utils";
import _ from "lodash";
import { logger } from "../shared/logger";
import { normalizeMetadata } from "../shared/utils";

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
    logger.error(
      "onchain-fetcher",
      `detectTokenStandard error. contractAddress:${contractAddress}, rpcURL:${rpcURL}, error:${error}`
    );

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

const getNetwork = (chainId) => {
  return _.upperCase(supportedChains[chainId]).replace(" ", "_");
};

const getContractName = async (contractAddress, rpcURL) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcURL);
    const contract = new ethers.Contract(
      contractAddress,
      ["function name() view returns (string)"],
      provider
    );
    const name = await contract.name();
    return name;
  } catch (e) {
    return null;
  }
};

const getCollectionMetadata = async (contractAddress, rpcURL) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcURL);
    const contract = new ethers.Contract(
      contractAddress,
      ["function contractURI() view returns (string)"],
      provider
    );
    let uri = await contract.contractURI();
    uri = normalizeLink(uri);

    const isDataUri = uri.startsWith("data:application/json;base64,");
    if (isDataUri) {
      uri = uri.replace("data:application/json;base64,", "");
    }

    const json = isDataUri
      ? JSON.parse(Buffer.from(uri, "base64").toString("utf-8"))
      : await fetch(uri, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          timeout: FETCH_TIMEOUT,
          // TODO: add proxy support to avoid rate limiting
          // agent:
        }).then((response) => response.json());

    return json;
  } catch (e) {
    return null;
  }
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

    const isDataUri = uri.startsWith("data:application/json;base64,");
    if (isDataUri) {
      uri = uri.replace("data:application/json;base64,", "");
    }

    if (isDataUri) {
      return [JSON.parse(Buffer.from(uri, "base64").toString("utf-8")), null];
    }

    // if the uri is not a valid url, return null
    if (!uri.startsWith("http")) {
      return [null, `Invalid URI: ${uri}`];
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
    return [null, e];
  }
};

export const fetchTokens = async (chainId, tokens) => {
  // TODO: Add support for other chains via RPC_URL
  const network = getNetwork(chainId);

  if (tokens.length === 0) return [];
  if (!Array.isArray(tokens)) tokens = [tokens];
  if (!process.env[`RPC_URL_${network}`])
    throw new Error(`Missing RPC_URL for chain ${network} id ${chainId}`);

  // Detect token standard, batch contract addresses together to call once per contract
  const contracts = [];
  tokens.forEach((token) => {
    if (!contracts.includes(token.contract)) {
      contracts.push(token.contract);
    }
  });

  const standards = await Promise.all(
    contracts.map(async (contract) => {
      const standard = await detectTokenStandard(contract, process.env[`RPC_URL_${network}`]);
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

  const RPC_URL = process.env[`RPC_URL_${network}`];
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
    logger.error(
      "onchain-fetcher",
      `fetchTokens sendBatch error. chainId:${chainId}, error:${error}`
    );

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
        if (!uri || uri === "") {
          return {
            contract: idToToken[token.id].contract,
            token_id: idToToken[token.id].tokenId,
            error: "Unable to decode tokenURI from contract",
          };
        }

        const [metadata, error] = await getTokenMetadataFromURI(uri);
        if (error) {
          // logger.error(
          //   "onchain-fetcher",
          //   JSON.stringify({
          //     message: "fetchTokens getTokenMetadataFromURI error",
          //     chainId,
          //     token,
          //     error,
          //     uri,
          //   })
          // );

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

export const fetchCollection = async (chainId, { contract }) => {
  const network = getNetwork(chainId);
  const collection = await getCollectionMetadata(contract, process.env[`RPC_URL_${network}`]);
  let collectionName = collection?.name ?? null;

  if (chainId === 43114) {
    logger.info(
      "onchain-fetcher",
      `fetchCollection. chainId=${chainId}, contract=${contract}, collectionName=${collectionName}, collection=${JSON.stringify(
        collection
      )}`
    );
  }

  // Fallback for collection name if collection metadata not found
  if (!collectionName) {
    collectionName =
      (await getContractName(contract, process.env[`RPC_URL_${network}`])) ?? contract;

    if (chainId === 43114) {
      logger.info(
        "onchain-fetcher",
        `fetchCollection - fallback. chainId=${chainId}, contract=${contract}, collectionName=${collectionName}, collection=${JSON.stringify(
          collection
        )}`
      );
    }
  }

  return {
    id: contract,
    slug: null,
    name: collectionName,
    metadata: normalizeMetadata(collection),
    contract,
    tokenSetId: `contract:${contract}`,
  };
};
