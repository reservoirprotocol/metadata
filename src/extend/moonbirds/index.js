import axios from "axios";

export const extend = async (_chainId, metadata) => {
  let nested;
  let nestLevel;
  let eyeColor;

  // get extra meta data from MB API
  const url = `https://birdwatching.moonbirds.xyz/moonbirds/${metadata.tokenId}`;
  const { data } = await axios.get(url, {});

  if (!data.moonbird) {
    throw new Error("Missing Moonbird");
  }

  nested = data.moonbird.nesting.nested;
  nestLevel = data.moonbird.nesting.nestLevel;
  eyeColor = data.moonbird.traits.eyeColor;

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
      {
        key: "Nested",
        value: nested,
        kind: "string",
        rank: 1,
      },
      {
        key: "Nest Level",
        value: nestLevel,
        kind: "string",
        rank: 1,
      },
      {
        key: "Eye Color",
        value: eyeColor,
        kind: "string",
        rank: 1,
      },
    ],
  };
};
