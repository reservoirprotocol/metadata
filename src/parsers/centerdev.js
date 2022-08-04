export const parse = (asset) => {
  let attributes = [];

  if (asset.metadata?.attributes) {
    attributes = asset.metadata.attributes.map((trait) => ({
      key: trait.trait_type,
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    }));
  } else if (asset.metadata?.features) {
    attributes = Object.entries(asset.metadata.features).map(([key, value]) => ({
      key,
      value,
      kind: typeof value == "number" ? "number" : "string",
      rank: 1,
    }));
  }

  return {
    contract: asset.address,
    tokenId: asset.token_id,
    name: asset.name,
    description: asset.metadata?.description,
    imageUrl: asset.metadata?.image,
    mediaUrl: asset.metadata?.animation_url,
    attributes,
  };
};
