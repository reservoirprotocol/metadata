export const parse = (contract, tokenId, collection, response) => {
  return {
    contract: contract,
    tokenId: tokenId,
    collection,
    name: response.name,
    flagged: false,
    description: response.description,
    imageUrl: response.image,
    mediaUrl: response.animation_url,
    attributes: (response.attributes || []).map((trait) => ({
      key: trait.traitType || "property",
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    })),
  };
};
