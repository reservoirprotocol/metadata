export const extendCollection = async (_chainId, metadata) => {
  return {
    ...metadata,
    royalties: [],
  };
};
