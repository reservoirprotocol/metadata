import axios from "axios";
import { Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import slugify from "slugify";

import { getProvider } from "../shared/utils";
import { logger } from "../shared/logger";

import { RequestWasThrottledError } from "./errors";
import { parse } from "../parsers/opensea";

const getOSNetworkName = (chainId) => {
  switch (chainId) {
    case 1:
      return "ethereum";
    case 4:
      return "rinkeby";
    case 5:
      return "goerli";
    case 10:
      return "optimism";
    case 56:
      return "bsc";
    case 137:
      return "matic";
    case 42161:
      return "arbitrum";
  }
};

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  try {
    let data;
    const network = getOSNetworkName(chainId);

    const baseUrl = `${
      ![4, 5].includes(chainId) ? "https://api.opensea.io" : "https://testnets-api.opensea.io"
    }`;

    const url = `${baseUrl}/api/v1/events?token_id=${tokenId}&asset_contract_address=${contract}`;
    const apiKey = process.env.OPENSEA_COLLECTION_API_KEY
      ? process.env.OPENSEA_COLLECTION_API_KEY.trim()
      : process.env.OPENSEA_API_KEY.trim();

    try {
      const headers = ![4, 5].includes(chainId)
        ? {
            url,
            "X-API-KEY": apiKey,
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
          };

      const assetResponse = await axios.get(
        ![4, 5].includes(chainId) ? process.env.OPENSEA_BASE_URL_ALT || url : url,
        { headers }
      );

      // Verify chain matches in case of multiple networks with same contract address
      if (network == assetResponse.data.asset_events[0]?.asset.asset_contract.chain_identifier) {
        data = assetResponse.data.asset_events[0]?.asset;
      } else {
        // Try offers API if we get a collection from the wrong chain
        const url = `${baseUrl}/v2/orders/${network}/seaport/offers?asset_contract_address=${contract}&token_ids=${tokenId}`;
        const headers = ![4, 5].includes(chainId)
          ? {
              url,
              "X-API-KEY": apiKey,
              Accept: "application/json",
            }
          : {
              Accept: "application/json",
            };

        const assetResponse = await axios.get(
          ![4, 5].includes(chainId) ? process.env.OPENSEA_BASE_URL_ALT || url : url,
          { headers }
        );

        data = assetResponse.data.orders[0]?.taker_asset_bundle.assets[0];
      }
    } catch (error) {
      logger.info(
        "opensea-fetcher",
        `Falling back to asset API for collection. chainId=${chainId}, url=${url}, apiKey=${apiKey}, contract:${contract}, tokenId:${tokenId}, message:${
          error.message
        }, 
          status:${error.response?.status}, data:${JSON.stringify(error.response?.data)}`
      );
    }

    if (!data) {
      const url = `${baseUrl}/api/v1/asset/${contract}/${tokenId}`;

      try {
        const headers = ![4, 5].includes(chainId)
          ? {
              url,
              "X-API-KEY": apiKey,
              Accept: "application/json",
            }
          : {
              Accept: "application/json",
            };

        const assetResponse = await axios.get(
          ![4, 5].includes(chainId) ? process.env.OPENSEA_BASE_URL_ALT || url : url,
          { headers }
        );

        data = assetResponse.data;
      } catch (error) {
        logger.error(
          "opensea-fetcher",
          `fetchCollection retrieve asset error. chainId=${chainId}, url=${url}, apiKey=${apiKey}, contract:${contract}, tokenId:${tokenId}, message:${
            error.message
          },  status:${error.response?.status}, data:${JSON.stringify(error.response?.data)}`
        );

        // Try to get the collection only based on the contract.
        if (error.response?.status === 404) {
          if (isNaN(Number(tokenId))) {
            logger.error(
              "opensea-fetcher",
              `fetchCollection retrieve asset contract - Invalid tokenId. chainId:${chainId}, contract:${contract}, tokenId:${tokenId}`
            );

            throw new Error(`Invalid tokenId.`);
          }

          const url = `${baseUrl}/api/v1/asset_contract/${contract}`;
          const headers = ![4, 5].includes(chainId)
            ? {
                url,
                "X-API-KEY": apiKey,
                Accept: "application/json",
              }
            : {
                Accept: "application/json",
              };

          const assetContractResponse = await axios.get(
            ![4, 5].includes(chainId) ? process.env.OPENSEA_BASE_URL_ALT || url : url,
            { headers }
          );

          data = assetContractResponse.data;
        } else {
          throw error;
        }
      }
    }

    if (!data?.collection) {
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

    // Collect the fees
    const royalties = [];
    const fees = [];

    for (const key in data.collection.fees.seller_fees) {
      if (data.collection.fees.seller_fees.hasOwnProperty(key)) {
        royalties.push({
          recipient: key,
          bps: data.collection.fees.seller_fees[key],
        });
      }
    }

    for (const key in data.collection.fees.opensea_fees) {
      if (data.collection.fees.opensea_fees.hasOwnProperty(key)) {
        fees.push({
          recipient: key,
          bps: data.collection.fees.opensea_fees[key],
        });
      }
    }

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
            safelistRequestStatus: data.collection.safelist_request_status,
          }
        : null,
      openseaRoyalties: royalties,
      openseaFees: fees,
      contract,
      tokenIdRange: null,
      tokenSetId: `contract:${contract}`,
    };
  } catch (error) {
    logger.error(
      "opensea-fetcher",
      JSON.stringify({
        topic: "fetchCollectionError",
        chainId,
        contract,
        tokenId,
        error,
      })
    );

    let name = contract;
    try {
      name = await new Contract(
        contract,
        new Interface(["function name() view returns (string)"]),
        getProvider(chainId)
      ).name();
    } catch {
      // Skip errors
    }

    return {
      id: contract,
      slug: slugify(name, { lower: true }),
      name,
      community: null,
      metadata: null,
      contract,
      tokenIdRange: null,
      tokenSetId: `contract:${contract}`,
      isFallback: true,
    };
  }
};

export const fetchTokens = async (chainId, tokens) => {
  const searchParams = new URLSearchParams();
  for (const { contract, tokenId } of tokens) {
    searchParams.append("asset_contract_addresses", contract);
    searchParams.append("token_ids", tokenId);
  }

  const url = `${
    ![4, 5].includes(chainId) ? "https://api.opensea.io" : "https://testnets-api.opensea.io"
  }/api/v1/assets?${searchParams.toString()}`;

  const data = await axios
    .get(![4, 5].includes(chainId) ? process.env.OPENSEA_BASE_URL_ALT || url : url, {
      headers: ![4, 5].includes(chainId)
        ? {
            url,
            "X-API-KEY": process.env.OPENSEA_API_KEY.trim(),
            Accept: "application/json",
          }
        : {
            Accept: "application/json",
          },
    })
    .then((response) => response.data)
    .catch((error) => {
      logger.error(
        "opensea-fetcher",
        `fetchTokens error. url:${url} chainId:${chainId}, message:${error.message},  status:${
          error.response?.status
        }, data:${JSON.stringify(error.response?.data)}, url:${JSON.stringify(
          error.config?.url
        )}, headers:${JSON.stringify(error.config?.headers?.url)}`
      );

      handleError(error);
    });

  return data.assets.map(parse).filter(Boolean);
};

export const fetchContractTokens = async (chainId, contract, continuation) => {
  const searchParams = new URLSearchParams();
  searchParams.append("asset_contract_address", contract);
  if (continuation) {
    searchParams.append("cursor", continuation);
  }

  const url = `${
    chainId === 1
      ? process.env.OPENSEA_BASE_URL || "https://api.opensea.io"
      : "https://rinkeby-api.opensea.io"
  }/api/v1/assets?${searchParams.toString()}`;
  const data = await axios
    .get(url, {
      headers:
        chainId === 1
          ? {
              [process.env.OPENSEA_API_HEADER ?? "X-API-KEY"]: process.env.OPENSEA_API_KEY.trim(),
              Accept: "application/json",
            }
          : {
              Accept: "application/json",
            },
    })
    .then((response) => response.data)
    .catch((error) => handleError(error));

  return {
    continuation: data.next,
    metadata: data.assets.map(parse).filter(Boolean),
  };
};

export const fetchTokensByCollectionSlug = async (chainId, slug, continuation) => {
  const searchParams = new URLSearchParams();
  if (continuation) {
    searchParams.append("cursor", continuation);
  }
  if (slug) {
    searchParams.append("collection_slug", slug);
  }
  searchParams.append("limit", "200");

  const url = `${
    chainId === 1
      ? process.env.OPENSEA_SLUG_BASE_URL || "https://api.opensea.io"
      : "https://rinkeby-api.opensea.io"
  }/api/v1/assets?${searchParams.toString()}`;
  const data = await axios
    .get(url, {
      headers:
        chainId === 1
          ? {
              [process.env.OPENSEA_SLUG_API_HEADER ?? "X-API-KEY"]:
                process.env.OPENSEA_SLUG_API_KEY.trim(),
              Accept: "application/json",
            }
          : {
              Accept: "application/json",
            },
    })
    .then((response) => response.data)
    .catch((error) => handleError(error));

  const assets = data.assets.map(parse).filter(Boolean);
  return {
    assets,
    continuation: data.next ?? undefined,
    previous: data.previous ?? undefined,
  };
};

const handleError = (error) => {
  if (error.response?.status === 429 || error.response?.status === 503) {
    let delay = 1;

    if (error.response.data.detail?.startsWith("Request was throttled. Expected available in")) {
      try {
        delay = error.response.data.detail.split(" ")[6];
      } catch {
        // Skip on any errors
      }
    }

    throw new RequestWasThrottledError(error.response.statusText, delay);
  }

  throw error;
};
