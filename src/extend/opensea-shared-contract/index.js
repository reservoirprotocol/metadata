export const extendCollection = async (chainId, metadata, tokenId) => {
  metadata.id = `${metadata.contract}:opensea-${metadata.slug}`;
  metadata.tokenIdRange = null;
  metadata.tokenSetId = null;

  return { ...metadata };
};

export const extend = async (chainId, metadata) => {
  metadata.collection = `${metadata.contract}:opensea-${metadata.slug}`;
  return { ...metadata };
};
