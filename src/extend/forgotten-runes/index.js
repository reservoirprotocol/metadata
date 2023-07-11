import wizards from "./wizards.json";

const rank = {
  Head: 14,
  Body: 13,
  Familiar: 12,
  Prop: 11,
  Rune: 10,
  Background: 9,
  Affinity: 8,
  "% Traits in Affinity": 7,
  "# Traits in Affinity": 6,
  "# Traits": 5,
  Title: 4,
  Name: 3,
  Origin: 2,
};

export const extend = async (_chainId, metadata) => {
  let attributes = [];
  for (const trait of Object.keys(rank)) {
    attributes.push({
      key: trait ?? "property",
      rank: rank[trait],
      value: wizards[metadata.tokenId][trait],
      kind: "string",
    });
  }

  return {
    ...metadata,
    attributes,
  };
};
