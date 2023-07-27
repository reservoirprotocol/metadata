import avatars from "./avatars.json";

export const extend = async (_chainId, metadata) => {
  const tokenId = metadata.tokenId;
  const relevantAvatar = avatars[tokenId];

  let attributes = [];

  const avatarKeys = Object.keys(relevantAvatar);
  const avatarValues = Object.values(relevantAvatar);

  for (let i = 0; i < avatarKeys.length; i++) {
    attributes.push({
      key: avatarKeys[i],
      value: avatarValues[i],
      kind: "string",
    });
  }

  return {
    ...metadata,
    attributes,
  };
};
