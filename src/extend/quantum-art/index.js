import { logger } from "../../shared/logger";

export const extendCollection = async (_chainId, metadata, tokenId = null) => {
  const startTokenId = tokenId - (tokenId % 10000);
  const endTokenId = startTokenId + 10000 - 1;

  metadata.id = `${metadata.contract}:${startTokenId}:${endTokenId}`;
  metadata.tokenIdRange = [startTokenId, endTokenId];
  metadata.tokenSetId = `range:${metadata.contract}:${startTokenId}:${endTokenId}`;

  logger.info("quantum-art", `tokenId = ${tokenId} metadata ${JSON.stringify(metadata)}`);

  return { ...metadata };
};

export const extend = async (_chainId, metadata) => {
  const tokenId = metadata.tokenId;
  const startTokenId = tokenId - (tokenId % 10000);
  const endTokenId = startTokenId + 10000 - 1;

  metadata.collection = `${metadata.contract}:${startTokenId}:${endTokenId}`;
  return { ...metadata };
};
