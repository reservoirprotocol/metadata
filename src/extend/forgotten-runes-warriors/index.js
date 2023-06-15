import warriors from "./warriors.json";

const rank = {
  Head: 14,
  Body: 13,
  Companion: 12,
  Weapon: 11,
  Shield: 10,
  Rune: 9,
  Background: 8,
  Affinity: 7,
  "% Traits in Affinity": 6,
  "# Traits in Affinity": 5,
  "# Traits": 4,
  Name: 3,
  Title: 2,
  Affiliation: 1,
};

export const extend = async (_chainId, metadata) => {
  var rankCopy = JSON.parse(JSON.stringify(rank));
  let attributes = [];

  metadata.attributes.forEach((attribute) => {
    const attributeKey = attribute.key.charAt(0).toUpperCase() + attribute.key.slice(1);
    attributes.push({
      key: attributeKey ?? "property",
      rank: rank[attributeKey] ? rank[attributeKey] : null,
      value: attribute.value,
      kind: "string",
    });

    delete rankCopy[attributeKey];
  });

  // Add Name attributes
  for (var attribute of ["Name", "Title", "Affiliation"]) {
    attributes.push({
      key: attribute ?? "property",
      rank: rankCopy[attribute] ? rankCopy[attribute] : null,
      value: warriors[metadata.tokenId][attribute],
      kind: "string",
    });

    delete rankCopy[attribute];
  }

  // Add 'None' value for missing attributes
  for (var attribute of Object.keys(rankCopy)) {
    attributes.push({
      key: attribute ?? "property",
      rank: rankCopy[attribute] ? rankCopy[attribute] : null,
      value: "None",
      kind: "string",
    });
  }

  return {
    ...metadata,
    attributes,
  };
};
