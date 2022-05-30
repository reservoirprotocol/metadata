export const extend = async (_chainId, metadata) => {
  let name = metadata.name;
  if (metadata.tokenId == 0) {
    name = "Phase 1";
  } else {
    name = "Phase 2";
  }

  return {
    ...metadata,
    name,
  };
};
