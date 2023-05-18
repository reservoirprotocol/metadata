import _ from "lodash";
import slugify from "slugify";

import * as soundxyz from "../extend/soundxyz";
import { logger } from "../shared/logger";
import { parse } from "../parsers/soundxyz";
import { RequestWasThrottledError } from "./errors";
import * as opensea from "./opensea";

export const getCollectionId = async (chainId, contract, tokenId) => {
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
        data: { releaseFromToken },
      },
    } = await soundxyz.getContractSlug(chainId, contract, tokenId);
    return `${contract}:soundxyz-${releaseFromToken.id}`;
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
        getCollectionId(chainId, contract, tokenId),
      ]);

      data.push(parse(contract, tokenId, collection, response.data.data.releaseFromToken));
    } catch (error) {
      logger.error(
        "soundxyz-fetcher",
        `fetchTokens error. chainId:${chainId}, message:${error.message},  status:${
          error.response?.status
        }, data:${JSON.stringify(error.response?.data)}`
      );

      handleError(error);
    }
  }

  return data.filter(Boolean);
};

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  const {
    data: {
      data: { releaseFromToken },
    },
  } = await soundxyz.getContractSlug(chainId, contract, tokenId);
  const royalties = [];

  if (releaseFromToken.fundingAddress && releaseFromToken.royaltyBps) {
    royalties.push({
      recipient: _.toLower(releaseFromToken.fundingAddress),
      bps: releaseFromToken.royaltyBps,
    });
  }

  return {
    id: `${contract}`,
    slug: slugify(releaseFromToken.titleSlug, { lower: true }),
    name: `${releaseFromToken.artist.name} - ${releaseFromToken.title}`,
    community: "sound.xyz",
    metadata: {
      imageUrl: releaseFromToken.coverImage.url,
      description: releaseFromToken.description,
      externalUrl: `https://sound.xyz/${releaseFromToken.artist.soundHandle}/${releaseFromToken.titleSlug}`,
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
