import axios from "axios";
import { Contract } from "ethers";
import { Interface } from "ethers/lib/utils";

import slugify from "slugify";
import { getProvider, normalizeMetadata } from "../shared/utils";

import { logger } from "../shared/logger";
import { RequestWasThrottledError } from "./errors";
import { parse } from "../parsers/opensea";
import _ from "lodash";
import { fetchTokens as fetchTokensOnChain } from "./onchain";

const apiKey = process.env.OPENSEA_COLLECTION_API_KEY
  ? process.env.OPENSEA_COLLECTION_API_KEY.trim()
  : process.env.OPENSEA_API_KEY.trim();

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
    case 42170:
      return "arbitrum_nova";
    case 43114:
      return "avalanche";
    case 8453:
      return "base";
    case 7777777:
      return "zora";
    case 11155111:
      return "sepolia";
    case 80001:
      return "mumbai";
    case 84531:
      return "base_goerli";
    case 999:
      return "zora_testnet";
  }
};

const isOSTestnet = (chainId) => {
  switch (chainId) {
    case 4:
    case 5:
    case 11155111:
    case 80001:
    case 84531:
    case 999:
      return true;
  }

  return false;
};

const getUrlForApi = (api, chainId, contract, tokenId, network, slug) => {
  const baseUrl = `${
    !isOSTestnet(chainId) ? "https://api.opensea.io" : "https://testnets-api.opensea.io"
  }`;

  switch (api) {
    case "asset":
      return `${baseUrl}/api/v1/asset/${contract}/${tokenId}`;
    case "events":
      return `${baseUrl}/api/v1/events?asset_contract_address=${contract}&token_id=${tokenId}`;
    case "offers":
      return `${baseUrl}/v2/orders/${network}/seaport/offers?asset_contract_address=${contract}&token_ids=${tokenId}`;
    case "asset_contract":
      return `${baseUrl}/api/v1/asset_contract/${contract}`;
    case "collection":
      return `${baseUrl}/api/v1/collection/${slug}`;
    case "nft":
      return `${baseUrl}/v2/chain/${network}/contract/${contract}/nfts/${tokenId}`;
  }
};

const getOSData = async (api, chainId, contract, tokenId, slug) => {
  const network = getOSNetworkName(chainId);
  const url = getUrlForApi(api, chainId, contract, tokenId, network, slug);

  const headers = !isOSTestnet(chainId)
    ? {
        url,
        "X-API-KEY": apiKey,
        Accept: "application/json",
      }
    : {
        Accept: "application/json",
      };

  try {
    const osResponse = await axios.get(
      !isOSTestnet(chainId) ? process.env.OPENSEA_BASE_URL_ALT || url : url,
      { headers }
    );

    switch (api) {
      case "events":
        // Fallback to offers API if we get a collection from the wrong chain
        if (network == osResponse.data.asset_events[0]?.asset.asset_contract.chain_identifier) {
          return osResponse.data.asset_events[0]?.asset;
        } else {
          return await getOSData("offers", chainId, contract, tokenId);
        }
      case "offers":
        return osResponse.data.orders[0]?.taker_asset_bundle.assets[0];
      case "asset":
      case "asset_contract":
      case "collection":
        return osResponse.data;
      case "nft":
        return osResponse.data.nft;
    }
  } catch (error) {
    if (api === "asset") {
      logger.error(
        "opensea-fetcher",
        JSON.stringify({
          topic: "getOSData",
          message: "Retrieve asset error.",
          chainId,
          url,
          contract,
          tokenId,
          error,
        })
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
        return await getOSData("asset_contract", chainId, contract);
      } else {
        throw error;
      }
    } else {
      logger.error(
        "opensea-fetcher",
        JSON.stringify({
          topic: "getOSData",
          message: "Could not fetch from API",
          chainId,
          url,
          contract,
          tokenId,
          error,
        })
      );
    }
  }
};

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  try {
    let data = await getOSData("nft", chainId, contract, tokenId);
    let creatorAddress = data?.creator;

    if (data?.collection) {
      data = await getOSData("collection", chainId, contract, tokenId, data.collection);
      creatorAddress = creatorAddress ?? data?.creator?.address;
    } else {
      if (chainId === 1) {
        data = await getOSData("asset", chainId, contract, tokenId);
      } else {
        data =
          (await getOSData("events", chainId, contract, tokenId)) ??
          (await getOSData("asset", chainId, contract, tokenId));
      }

      // Get payment tokens if we have the collection slug
      if (data?.collection?.slug && !data?.collection?.payment_tokens) {
        data = await getOSData("collection", chainId, contract, tokenId, data.collection.slug);
      }

      creatorAddress = data?.creator?.address;
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
      metadata: data.collection ? normalizeMetadata(data.collection) : null,
      openseaRoyalties: royalties,
      openseaFees: fees,
      contract,
      tokenIdRange: null,
      tokenSetId: `contract:${contract}`,
      paymentTokens: data.collection.payment_tokens
        ? data.collection.payment_tokens.map((token) => {
            return {
              address: token.address,
              decimals: token.decimals,
              name: token.name,
              symbol: token.symbol,
            };
          })
        : undefined,
      creator: creatorAddress ? _.toLower(creatorAddress) : null,
    };
  } catch (error) {
    logger.error(
      "opensea-fetcher",
      JSON.stringify({
        topic: "fetchCollectionError",
        message: `Could not fetch collection. chainId=${chainId}, contract=${contract}, tokenId=${tokenId}, error=${error.message}`,
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
    } catch (error) {
      logger.error(
        "opensea-fetcher",
        JSON.stringify({
          topic: "fetchContractNameError",
          message: `Could not fetch collection. chainId=${chainId}, contract=${contract}, tokenId=${tokenId}, error=${error.message}`,
          chainId,
          contract,
          tokenId,
          error,
        })
      );
    }

    return {
      id: contract,
      slug: null,
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
    !isOSTestnet(chainId) ? "https://api.opensea.io" : "https://testnets-api.opensea.io"
  }/api/v1/assets?${searchParams.toString()}`;

  const data = await axios
    .get(!isOSTestnet(chainId) ? process.env.OPENSEA_BASE_URL_ALT || url : url, {
      headers: !isOSTestnet(chainId)
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
