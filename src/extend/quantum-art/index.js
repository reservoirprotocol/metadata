export const extendCollection = async (_chainId, metadata, tokenId = null) => {
  if (isNaN(Number(tokenId))) {
    throw new Error(`Invalid tokenId ${tokenId}`);
  }

  const startTokenId = tokenId - (tokenId % 10000);
  const endTokenId = startTokenId + 10000 - 1;

  metadata.id = `${metadata.contract}:${startTokenId}:${endTokenId}`;
  metadata.tokenIdRange = [startTokenId, endTokenId];
  metadata.tokenSetId = `range:${metadata.contract}:${startTokenId}:${endTokenId}`;

  return { ...metadata };
};

export const extend = async (_chainId, metadata) => {
  const tokenId = metadata.tokenId;
  const startTokenId = tokenId - (tokenId % 10000);
  const endTokenId = startTokenId + 10000 - 1;

  metadata.collection = `${metadata.contract}:${startTokenId}:${endTokenId}`;
  return { ...metadata };
};
