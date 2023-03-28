import { defaultAbiCoder, solidityPack } from "ethers/lib/utils";
import { ethers } from "ethers";
import fetch from "node-fetch";
import { parse } from "../parsers/onchain";
import { RequestWasThrottledError } from "./errors";

const FETCH_TIMEOUT = 30000;
const ALLOWED_CHAIN_IDS = [1, 5, 10, 137, 42161];

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
    console.log("Sending batch", encodedTokens, RPC_URL);
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

export const fetchTokens = async (chainId, tokens, standard = "ERC721") => {
  // TODO: Add support for other chains via RPC_URL
  if (tokens.length === 0) return [];
  if (!Array.isArray(tokens)) tokens = [tokens];
  if (!ALLOWED_CHAIN_IDS.includes(chainId)) throw new Error("Invalid chainId");

  // We need to have some type of hash map to map the tokenid + contract to the tokenURI
  const idToToken = {};
  tokens.forEach((token) => {
    const randomInt = Math.floor(Math.random() * 100000);
    idToToken[randomInt] = token;
    token.requestId = randomInt;
  });

  const RPC_URL = process.env[`RPC_URL_${chainId}`];
  const encodeTokenFunction = standard === "ERC721" ? encodeTokenERC721 : encodeTokenERC1155;
  const encodedTokens = tokens.map(encodeTokenFunction);
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

export const getCollectionMetadata = async (contractAddress, chainId) => {};

export const fetchContractTokens = async (chainId, contract, from, to) => {};
