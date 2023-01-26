export const extendCollection = async (_chainId, metadata, tokenId = null) => {
  return {
    ...metadata,
    metadata: {
      ...metadata.metadata,
      imageUrl: "https://i.ibb.co/hy6vSS2/gmoney-collection.png",
    },
  };
};
