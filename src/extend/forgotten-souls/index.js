import souls from "./souls.json";

const rank = {
  Head: 13,
  Body: 12,
  Familiar: 11,
  Prop: 10,
  Rune: 9,
  Background: 8,
  Undesirable: 7,
  Affinity: 6,
  "% Traits in Affinity": 5,
  "# Traits in Affinity": 4,
  "# Traits": 3,
  Title: 2,
  Name: 1,
  Origin: 0,
};

export const extend = async (_chainId, metadata) => {
  let attributes = [];
  let isUndesirable = false;
  let coreTraits = {
    Head: "",
    Body: "",
    Familiar: "",
    Prop: "",
    Rune: "",
  };

  metadata.attributes.forEach((attribute) => {
    const attributeKey = attribute.key.charAt(0).toUpperCase() + attribute.key.slice(1);
    attributes.push({
      key: attributeKey ?? "property",
      rank: rank[attributeKey] ? rank[attributeKey] : null,
      value: attribute.value,
      kind: "string",
    });

    if (attributeKey === "Undesirable") {
      isUndesirable = true;
    }

    if (attributeKey in coreTraits) {
      coreTraits[attributeKey] = attribute.value;
    }
  });

  if (!isUndesirable) {
    // Add name traits
    for (var attribute of ["Title", "Name", "Origin"]) {
      if (String(metadata.tokenId) in souls) {
        attributes.push({
          key: attribute ?? "property",
          rank: rank[attribute],
          value: souls[metadata.tokenId][attribute.toLowerCase()],
          kind: "string",
        });
      }
    }

    // Add None value for core traits
    for (var trait of ["Head", "Body", "Familiar", "Prop", "Rune"]) {
      if (!coreTraits[trait]) {
        attributes.push({
          key: trait ?? "property",
          rank: rank[trait],
          value: "None",
          kind: "string",
        });
      }
    }
  }

  return {
    ...metadata,
    attributes,
  };
};
