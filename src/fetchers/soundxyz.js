import axios from "axios";
import _ from "lodash";
import slugify from "slugify";

import * as soundxyz from "../custom/soundxyz";
import { logger } from "../logger";
import { parse } from "../parsers/soundxyz";
import { RequestWasThrottledError } from "./errors";
import * as opensea from "./opensea";

export const getCollection = async (chainId, contract, tokenId) => {
  try {
    // If this is not a shared contract collection -> contract
    if (
      _.indexOf(soundxyz.SoundxyzArtistContracts, _.toLower(contract)) === -1 &&
      _.indexOf(soundxyz.SoundxyzReleaseContracts, _.toLower(contract)) === -1
    ) {
      return contract;
    }

    // Shared contract logic
    const {
      data: {
        data: { nft },
      },
    } = await soundxyz.getContractSlug(chainId, contract, tokenId);
    return `${contract}:soundxyz-${nft.release.id}`;
  } catch (error) {
    throw error;
  }
};

export const fetchTokens = async (chainId, tokens) => {
  let data = [];

  for (const { contract, tokenId } of tokens) {
    try {
      const [response, collection] = await Promise.all([
        soundxyz.getContractSlug(chainId, contract, tokenId),
        getCollection(chainId, contract, tokenId),
      ]);

      data.push(parse(contract, tokenId, collection, response.data.data.nft));
    } catch (error) {
      logger.error(
        "soundxyz-fetcher",
        `fetchTokens error. chainId:${chainId}, message:${
          error.message
        },  status:${error.response?.status}, data:${JSON.stringify(
          error.response?.data
        )}`
      );

      handleError(error);
    }
  }

  return data.filter(Boolean);
};

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  const {
    data: {
      data: { nft },
    },
  } = await soundxyz.getContractSlug(chainId, contract, tokenId);
  const royalties = [];

  if (nft.release.fundingAddress && nft.release.royaltyBps) {
    royalties.push({
      recipient: _.toLower(nft.release.fundingAddress),
      bps: nft.release.royaltyBps,
    });
  }

  return {
    id: `${contract}`,
    slug: slugify(nft.release.titleSlug, { lower: true }),
    name: `${nft.release.artist.name} - ${nft.release.title}`,
    community: "sound.xyz",
    metadata: {
      imageUrl: nft.release.coverImage.url,
      description: nft.release.description,
      externalUrl: `https://sound.xyz/${nft.release.artist.soundHandle}/${nft.release.titleSlug}`,
    },
    royalties,
    openseaRoyalties: await opensea
      .fetchCollection(chainId, { contract })
      .then((m) => m.openseaRoyalties)
      .catch((error) => []),
    contract,
    tokenIdRange: null,
    tokenSetId: `contract:${contract}`,
  };
};

const handleError = (error) => {
  if (error.response?.status === 429) {
    let delay = 1;
    throw new RequestWasThrottledError(error.response.statusText, delay);
  }

  throw error;
};
