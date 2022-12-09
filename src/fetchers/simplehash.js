import axios from "axios";
import { Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import slugify from "slugify";

import { parse } from "../parsers/simplehash";
import { getProvider } from "../utils";
import { logger } from "../logger";
import _ from "lodash";

const getNetworkName = (chainId) => {
  let network;
  if (chainId === 1) {
    network = "ethereum";
  } else if (chainId === 10) {
    network = "optimism";
  } else if (chainId === 137) {
    network = "polygon";
  } else {
    throw new Error("Unsupported chain id");
  }

  return network;
};

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  try {
    const network = getNetworkName(chainId);

    const url = `https://api.simplehash.com/api/v0/nfts/${network}/${contract}/${tokenId}`;
    const data = await axios
      .get(url, {
        headers: { "X-API-KEY": process.env.SIMPLEHASH_API_KEY.trim() },
      })
      .then((response) => response.data.collection);

    let slug = slugify(data.name, { lower: true });
    if (_.isArray(data.marketplace_pages)) {
      for (const market of data.marketplace_pages) {
        if (market.marketplace_id === "opensea") {
          slug = slugify(market.marketplace_collection_id, { lower: true });
        }
      }
    }

    return {
      id: contract,
      slug,
      name: data.name,
      community: null,
      metadata: {
        description: data.description,
        imageUrl: data.image_url,
        bannerImageUrl: data.banner_image_url,
        discordUrl: data.discord_url,
        externalUrl: data.external_url,
        twitterUsername: data.twitter_username,
      },
      royalties: [
        // TODO: Integrate royalties
      ],
      openseaRoyalties: [],
      contract,
      tokenIdRange: null,
      tokenSetId: `contract:${contract}`,
    };
  } catch {
    try {
      logger.error(
        "simplehash-fetcher",
        `fetchCollection error. chainId:${chainId}, contract:${contract}, message:${
          error.message
        },  status:${error.response?.status}, data:${JSON.stringify(
          error.response?.data
        )}`
      );

      const name = await new Contract(
        contract,
        new Interface(["function name() view returns (string)"]),
        getProvider(chainId)
      ).name();

      return {
        id: contract,
        slug: slugify(name, { lower: true }),
        name: name,
        community: null,
        metadata: null,
        royalties: [],
        openseaRoyalties: [],
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
  const nftIds = tokens.map(
    ({ contract, tokenId }) => `${network}.${contract}.${tokenId}`
  );
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
        `fetchTokens error. chainId:${chainId}, message:${
          error.message
        },  status:${error.response?.status}, data:${JSON.stringify(
          error.response?.data
        )}`
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
