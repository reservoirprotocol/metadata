import web3 from "web3";
import fetch from "node-fetch";
import { parse } from "../parsers/onchain";

const FETCH_TIMEOUT = 30000;

let Web3Local = new web3(web3.givenProvider || process.env.MAINNET_RPC_URL);

let Web3Instances = [];
let Web3InstanceMax = 10;
for (let i = 0; i < Web3InstanceMax; i++) {
  Web3Instances.push(new web3(process.env.MAINNET_RPC_URL));
}

const getWeb3 = () => {
  const instance = Web3Instances.shift();
  Web3Instances.push(instance);
  return instance;
};

setInterval(() => {
  // Every 10 minutes, we refresh the web3 instances to bring old memory out of scope to avoid memory leaks
  Web3Instances = [];
  for (let i = 0; i < Web3InstanceMax; i++) {
    Web3Instances.push(new web3(process.env.MAINNET_RPC_URL));
  }
}, 60 * 1000);

const encodeTokenERC721 = (token) => {
  return {
    id: token.requestId,
    encodedTokenID: Web3Local.eth.abi.encodeFunctionCall(
      {
        name: "tokenURI",
        type: "function",
        inputs: [
          {
            type: "uint256",
            name: "tokenId",
          },
        ],
      },
      [token.tokenId]
    ),
    contract: token.contract,
  };
};

const encodeTokenERC1155 = (token) => {
  return {
    id: token.requestId,
    encodedTokenID: Web3Local.eth.abi.encodeFunctionCall(
      {
        name: "uri",
        type: "function",
        inputs: [
          {
            type: "uint256",
            name: "tokenId",
          },
        ],
      },
      [token.tokenId]
    ),
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
  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createBatch(encodedTokens)),
      timeout: FETCH_TIMEOUT,
      // TODO: add proxy support to avoid rate limiting
      // agent:
    });
    const json = await response.json();
    return [json, null];
  } catch (e) {
    return [null, e.message];
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

export const fetchTokens = async (chainId, tokens, standard = "ERC721") => {
  // TODO: Add support for other chains via RPC_URL
  if (tokens.length === 0) return [];
  if (!Array.isArray(tokens)) tokens = [tokens];
  //   if (tokens.length > 20) throw new Error("Too many tokenIds (max 20)");
  if (chainId !== 1) throw new Error("Only mainnet is supported");

  // We need to have some type of hash map to map the tokenid + contract to the tokenURI
  const idToToken = {};
  tokens.forEach((token) => {
    const randomInt = Math.floor(Math.random() * 100000);
    idToToken[randomInt] = token;
    token.requestId = randomInt;
  });

  const RPC_URL = process.env.MAINNET_RPC_URL;
  const encodeTokenFunction = standard === "ERC721" ? encodeTokenERC721 : encodeTokenERC1155;
  const encodedTokens = tokens.map(encodeTokenFunction);
  const [batch, error] = await sendBatch(encodedTokens, RPC_URL);
  if (error) {
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
      const uri = Web3Local.eth.abi.decodeParameter("string", token.result);
      const [metadata, error] = await getTokenMetadataFromURI(uri);
      if (error) {
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
    })
  );

  return resolvedMetadata.map((token) => {
    return parse(token);
  });
};

export const getCollectionMetadata = async (contractAddress, chainId) => {};

export const fetchContractTokens = async (chainId, contract, from, to) => {};
