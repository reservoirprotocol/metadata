import { getContractSlug } from "../custom/soundxyz";
import axios from "axios";
import { logger } from "../logger";
import { parse } from "../parsers/soundxyz";
import { RequestWasThrottledError } from "./errors";
import * as soundxyz from "../custom/soundxyz";
import _ from "lodash";

export const getCollection = async (chainId, contract, tokenId) => {
  try {
    // If this is not a shared contract collection -> contract
    if (_.indexOf(soundxyz.SoundxyzArtistContracts, contract) !== -1 && _.indexOf(soundxyz.SoundxyzReleaseContracts, contract) !== -1) {
      return contract;
    }

    // Shared contract logic
    const { data: { data: { nft } } } = await getContractSlug(chainId, contract, tokenId);
    return `${contract}:soundxyz-${nft.release.id}`;
  } catch (error) {
    throw error
  }
};

export const fetchTokens = async (chainId, tokens) => {
  let data = [];

  for (const { contract, tokenId } of tokens) {
    const url =
      chainId === 1
        ? `https://metadata.sound.xyz/v1/${contract}/${tokenId}`
        : `https://staging.metadata.sound.xyz/v1/${contract}/${tokenId}`;

    try {
      const[response, collection] = await Promise.all([axios.get(url), getCollection(chainId, contract, tokenId)]);
      data.push(parse(contract, tokenId, collection, response.data));
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

const handleError = (error) => {
  if (error.response?.status === 429) {
    let delay = 1;
    throw new RequestWasThrottledError(error.response.statusText, delay);
  }

  throw error;
};