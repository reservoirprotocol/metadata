export const extendCollection = (_chainId, metadata) => {
  return {
    ...metadata,
    metadata: {
      ...metadata.metadata,
      imageUrl: "https://i.ibb.co/hy6vSS2/gmoney-collection.png",
    },
  };
};
