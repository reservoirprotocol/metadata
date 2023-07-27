import avatars from "./avatars.json";

export const extend = async (_chainId, metadata) => {
  const tokenId = metadata.tokenId;
  const relevantAvatar = avatars[tokenId];

  let attributes = [];

  const avatarKeys = Objects.keys(relevantAvatar);
  const avatarValues = Objects.values(relevantAvatar);

  for (let i = 0; i < avatarKeys.length; i++) {
    const attributeKey = avatarKeys[i].charAt(0).toUpperCase() + avatarKeys[i].slice(1);
    attributes.push({
      key: attributeKey ?? "property",
      value: avatarValues[i],
      kind: "string",
    });
  }

  return {
    ...metadata,
    attributes,
  };
};
