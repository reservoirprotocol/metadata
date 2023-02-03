export const extend = async (_chainId, metadata) => {
  return {
    ...metadata,
    attributes: [
      ...metadata.attributes,
      {
        key: "Trait Count",
        value: metadata.attributes.length,
        kind: "string",
        rank: 2,
      },
    ],
  };
};
