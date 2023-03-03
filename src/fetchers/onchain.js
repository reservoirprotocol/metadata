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
  return json;
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
  // TODO: Add support for other chains
  // TODO: Add support for ERC-1155 and other standards
  if (tokens.length === 0) return [];
  if (!Array.isArray(tokens)) tokens = [tokens];
  // TODO: Add support for more than 20 tokens
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
  const batch = await sendBatch(encodedTokens, RPC_URL);

  const resolvedMetadata = await Promise.all(
    batch.map(async (token) => {
      const uri = Web3Local.eth.abi.decodeParameter("string", token.result);
      const metadata = await getTokenMetadataFromURI(uri);
      if (metadata[1]) {
        return {
          contract: idToToken[token.id].contract,
          token_id: idToToken[token.id].tokenId,
          error: metadata[1],
        };
      }

      return {
        ...metadata[0],
        //   image: image ? image[0] : null,
        contract: idToToken[token.id].contract,
        token_id: idToToken[token.id].tokenId,
      };
    })
  );

  return resolvedMetadata.map((token) => {
    return parse(token);
  });
};

// TODO: Implement this, maybe we just use the OpenSea API for this, not sure
export const getCollectionMetadata = async (contractAddress, chainId) => {};

export const fetchContractTokens = async (chainId, contract, from, to) => {
  if (chainId !== 1) throw new Error("Only mainnet is supported");
  // TODO: Add support for other chains

  // create token array from from to to
  const tokens = [];
  for (let i = from; i <= to; i++) {
    tokens.push({
      contract: contract,
      tokenId: i,
    });
  }

  return fetchTokens(chainId, tokens);
};

const getAllTokenIds = async (chainId, contractAddress) => {
  if (chainId !== 1) throw new Error("Only mainnet is supported");
  // TODO: Add support for other chains

  // TODO: Add support for ERC-1155 and other standards, this is just ERC-721
  const transferABI = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
  ];

  const contract = new (getWeb3().eth.Contract)(transferABI, contractAddress);

  const tokenIds = [];
  const start = 0;

  // current block number + 3 to make sure we get all the events
  const end = (await getWeb3().eth.getBlockNumber()) + 3;
  const tokens = await getTokenIds(contract, start, end, tokenIds);

  return new Set(tokens);
};

// Recursive function to fetch all the events, in case the contract has too many events (> 10000)
const getTokenIds = async (contract, start, end, tokenIds) => {
  try {
    const results = await contract.getPastEvents("Transfer", {
      filter: { from: "0x0000000000000000000000000000000000000000" },
      fromBlock: start,
      toBlock: end,
    });

    if (results.length > 0) {
      tokenIds = tokenIds.concat(results.map((event) => event.returnValues.tokenId));
    }
    return tokenIds;
  } catch (e) {
    const middle = Math.round((start + end) / 2);
    return [
      ...(await getTokenIds(contract, start, middle + 1, tokenIds)),
      ...(await getTokenIds(contract, middle + 1, end, tokenIds)),
    ];
  }
};
