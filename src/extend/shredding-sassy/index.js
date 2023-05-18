export const extend = async (_chainId, metadata) => {
  const traitCount = metadata.attributes.length;

  return {
    ...metadata,
    attributes: [
      ...metadata.attributes,
      {
        key: "Trait Count",
        value: traitCount,
        kind: "string",
      },
    ],
  };
};
