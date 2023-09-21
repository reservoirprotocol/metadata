import axios from "axios";
import { Contract } from "ethers";
import { Interface } from "ethers/lib/utils";

import { parse } from "../parsers/simplehash";
import { supportedChains, getProvider, normalizeMetadata } from "../shared/utils";
import { logger } from "../shared/logger";
import _ from "lodash";
import slugify from "slugify";

const getNetworkName = (chainId) => {
  const network = supportedChains[chainId];
  if (!network) {
    throw new Error("Unsupported chain id");
  }

  if (network == "mainnet") {
    return "ethereum";
  }

  if (network == "zksync") {
    return "zksync-era";
  }

  if (network == "goerli") {
    return "ethereum-goerli";
  }

  if (network == "mumbai") {
    return "polygon-mumbai";
  }

  if (network == "sepolia") {
    return "ethereum-sepolia";
  }

  return network;
};

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  const network = getNetworkName(chainId);
  const url = `https://api.simplehash.com/api/v0/nfts/${network}/${contract}/${tokenId}`;

  try {
    const data = await axios
      .get(url, {
        headers: { "X-API-KEY": process.env.SIMPLEHASH_API_KEY.trim() },
      })
      .then((response) => response.data);

    let slug = null;
    if (_.isArray(data.collection.marketplace_pages)) {
      for (const market of data.collection.marketplace_pages) {
        if (market.marketplace_id === "opensea") {
          slug = slugify(market.marketplace_collection_id, { lower: true });
        }
      }
    }

    return {
      id: contract,
      slug,
      name: data.collection.name,
      community: null,
      metadata: normalizeMetadata(data.collection),
      contract,
      tokenIdRange: null,
      tokenSetId: `contract:${contract}`,
      creator: _.toLower(data.contract.deployed_by),
    };
  } catch {
    try {
      logger.error(
        "simplehash-fetcher",
        `fetchCollection error. url:${url}  chainId:${chainId}, contract:${contract}, message:${
          error.message
        },  status:${error.response?.status}, data:${JSON.stringify(error.response?.data)}`
      );

      const name = await new Contract(
        contract,
        new Interface(["function name() view returns (string)"]),
        getProvider(chainId)
      ).name();

      return {
        id: contract,
        slug: null,
        name: name,
        community: null,
        metadata: null,
        contract,
        tokenIdRange: null,
        tokenSetId: `contract:${contract}`,
        isFallback: true,
      };
    } catch {
      return null;
    }
  }
};

export const fetchTokens = async (chainId, tokens) => {
  const network = getNetworkName(chainId);
  const searchParams = new URLSearchParams();

  const nftIds = tokens.map(({ contract, tokenId }) => `${network}.${contract}.${tokenId}`);

  searchParams.append("nft_ids", nftIds.join(","));

  const url = `https://api.simplehash.com/api/v0/nfts/assets?${searchParams.toString()}`;
  const data = await axios
    .get(url, {
      headers: { "X-API-KEY": process.env.SIMPLEHASH_API_KEY.trim() },
    })
    .then((response) => response.data)
    .catch((error) => {
      logger.error(
        "simplehash-fetcher",
        `fetchTokens error. url:${url} chainId:${chainId}, message:${error.message},  status:${
          error.response?.status
        }, data:${JSON.stringify(error.response?.data)}`
      );

      throw error;
    });

  return data.nfts.map(parse).filter(Boolean);
};

export const fetchContractTokens = async (chainId, contract, continuation) => {
  const network = getNetworkName(chainId);
  const searchParams = new URLSearchParams();
  if (continuation) {
    searchParams.append("cursor", continuation);
  }

  const url = `https://api.simplehash.com/api/v0/nfts/${network}/${contract}?${searchParams.toString()}`;
  const data = await axios
    .get(url, {
      headers: { "X-API-KEY": process.env.SIMPLEHASH_API_KEY.trim() },
    })
    .then((response) => response.data);

  return {
    continuation: data.next,
    metadata: data.nfts.map(parse).filter(Boolean),
  };
};
