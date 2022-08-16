import axios from "axios";
import { Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import slugify from "slugify";

import { getProvider } from "../utils";
import { logger } from "../logger";

import { RequestWasThrottledError } from "./errors";
import { parseAsset, parseAssets } from "../parsers/opensea";

export const fetchCollection = async (chainId, { contract }) => {
  logger.info(
      "opensea-fetcher", `fetchCollection. chainId:${chainId}, contract:${contract}`
  );

  try {
    const url = `https://api.opensea.io/api/v1/asset_contract/${contract}`;
    const { data } = await axios.get(url, {
      headers: {
        "x-api-key": process.env.OPENSEA_COLLECTION_API_KEY.trim(),
      },
    });

    if (!data.collection) {
      throw new Error("Missing collection");
    }

    // TODO: Do we really need these here?
    const communities = {
      "0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7": "loot",
      "0x8db687aceb92c66f013e1d614137238cc698fedb": "loot",
      "0x1dfe7ca09e99d10835bf73044a23b73fc20623df": "loot",
      "0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42": "forgottenrunes",
      "0xf55b615b479482440135ebf1b907fd4c37ed9420": "forgottenrunes",
      "0x31158181b4b91a423bfdc758fc3bf8735711f9c5": "forgottenrunes",
      "0x251b5f14a825c537ff788604ea1b58e49b70726f": "forgottenrunes",
      "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85": "ens",
    };

    return {
      id: contract,
      slug: data.collection.slug,
      name: data.collection ? data.collection.name : data.name,
      community: communities[contract] || null,
      metadata: data.collection
        ? {
            description: data.collection.description,
            imageUrl: data.collection.image_url,
            bannerImageUrl: data.collection.banner_image_url,
            discordUrl: data.collection.discord_url,
            externalUrl: data.collection.external_url,
            twitterUsername: data.collection.twitter_username,
          }
        : null,
      royalties: [
        {
          recipient: data.payout_address,
          bps: data.dev_seller_fee_basis_points,
        },
      ],
      contract,
      tokenIdRange: null,
      tokenSetId: `contract:${contract}`,
    };
  } catch {
    logger.error(
        "opensea-fetcher", `fetchCollection error. chainId:${chainId}, contract:${contract}, message:${error.message},  status:${error.response?.status
        }, data:${JSON.stringify(error.response?.data)}`);

    try {
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

export const fetchToken = async (chainId, contract, tokenId) => {
  const url =
    chainId === 1
      ? `https://api.opensea.io/api/v1/asset/${contract}/${tokenId}/`
      : `https://rinkeby-api.opensea.io/api/v1/asset/${contract}/${tokenId}/`;

  const data = await axios
    .get(url, {
      headers:
        chainId === 1
          ? {
            "X-API-KEY": process.env.OPENSEA_TOKENS_API_KEY.trim(),
          }
          : {},
    })
    .then((response) => response.data)
    .catch((error) => {
        logger.error(
            "opensea-fetcher", `fetchToken error. chainId:${chainId}, contract:${contract}, tokenId:${tokenId}, message:${error.message},  status:${error.response?.status
            }, data:${JSON.stringify(error.response?.data)}`);

        handleError(error);
      });

  return [parseAsset(data)].filter(Boolean);
};

export const fetchTokens = async (chainId, tokens) => {
  logger.info(
      "opensea-fetcher", `fetchTokens. chainId:${chainId} count:${tokens.length}`
  );

  const searchParams = new URLSearchParams();
  for (const { contract, tokenId } of tokens) {
    searchParams.append("asset_contract_addresses", contract);
    searchParams.append("token_ids", tokenId);
  }

  const url =
    chainId === 1
      ? `https://api.opensea.io/api/v1/assets?${searchParams.toString()}`
      : `https://rinkeby-api.opensea.io/api/v1/assets?${searchParams.toString()}`;
  const data = await axios
    .get(url, {
      headers:
        chainId === 1
          ? {
              "X-API-KEY": process.env.OPENSEA_TOKENS_API_KEY.trim(),
            }
          : {},
    })
    .then((response) => response.data)
    .catch((error) => {
      logger.error(
          "opensea-fetcher", `fetchTokens error. chainId:${chainId}, message:${error.message},  status:${error.response?.status
          }, data:${JSON.stringify(error.response?.data)}`);

      handleError(error);
    });

  return data.assets.map(parseAssets).filter(Boolean);
};

export const fetchContractTokens = async (chainId, contract, continuation) => {
  const searchParams = new URLSearchParams();
  searchParams.append("asset_contract_address", contract);
  if (continuation) {
    searchParams.append("cursor", continuation);
  }

  const url =
    chainId === 1
      ? `https://api.opensea.io/api/v1/assets?${searchParams.toString()}`
      : `https://rinkeby-api.opensea.io/api/v1/assets?${searchParams.toString()}`;
  const data = await axios
    .get(url, {
      headers:
        chainId === 1
          ? {
              "X-API-KEY": process.env.OPENSEA_API_KEY.trim(),
            }
          : {},
    })
    .then((response) => response.data)
    .catch((error) => handleError(error));

  return {
    continuation: data.next,
    metadata: data.assets.map(parseAssets).filter(Boolean),
  };
};

const handleError = (error) => {
  if (error.response?.status === 429) {
    let delay = 1;

    if (
        error.response.data.detail?.startsWith("Request was throttled. Expected available in")
    ) {
      try {
        delay = error.response.data.detail.split(" ")[6];
      } catch {
        // Skip on any errors
      }
    }

    throw new RequestWasThrottledError(error.response.statusText, delay);
  }

  throw(error);
};
