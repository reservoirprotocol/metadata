export const extendCollection = async (_chainId, metadata, tokenId = null) => {
  return {
    ...metadata,
    royalties: [],
  };
};
