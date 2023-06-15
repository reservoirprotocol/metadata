import _ from "lodash";

export const parse = (asset) => {
  let attributes = [];

  if (asset.metadata?.attributes) {
    attributes = asset.metadata.attributes.map((trait) => ({
      key: trait.trait_type ?? "property",
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

  let imageUrl = asset.metadata?.image;

  if (imageUrl && imageUrl.startsWith("ipfs://")) {
    imageUrl = asset.small_preview_image_url;
  }

  return {
    contract: asset.address,
    tokenId: asset.token_id,
    collection: _.toLower(asset.address),
    name: asset.name,
    description: asset.metadata?.description,
    imageUrl,
    mediaUrl: asset.metadata?.animation_url,
    attributes,
  };
};
