export const extend = async (_chainId, metadata) => {
  metadata.attributes.forEach((attribute) => {
    attribute.key = attribute.key.charAt(0).toUpperCase() + attribute.key.slice(1);
    attribute.kind = "string";
  });

  return metadata;
};
