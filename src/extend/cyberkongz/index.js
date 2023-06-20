import { logger } from "../../shared/logger";
import _ from "lodash";

export const extendCollection = async (_chainId, metadata, tokenId) => {
  let startTokenId;
  let endTokenId;

  if (!tokenId || !_.isNumber(tokenId) || tokenId < 0 || tokenId > 5000) {
    throw new Error(`Unknown tokenId ${tokenId}`);
  }

  if (tokenId <= 1000) {
    startTokenId = 1;
    endTokenId = 1000;
  } else {
    startTokenId = 1001;
    endTokenId = 5000;
  }

  metadata.id = `${metadata.contract}:${startTokenId}:${endTokenId}`;
  metadata.tokenIdRange = [startTokenId, endTokenId];
  metadata.tokenSetId = `range:${metadata.contract}:${startTokenId}:${endTokenId}`;
  metadata.isFallback = undefined;

  return { ...metadata };
};

export const extend = async (_chainId, metadata) => {
  const tokenId = metadata.tokenId;
  let startTokenId;
  let endTokenId;

  if (tokenId <= 1000) {
    startTokenId = 1;
    endTokenId = 1000;
  } else {
    startTokenId = 1001;
    endTokenId = 5000;
  }

  metadata.collection = `${metadata.contract}:${startTokenId}:${endTokenId}`;
  return { ...metadata };
};
