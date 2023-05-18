import _ from "lodash";

export const parse = (asset) => {
  return {
    contract: asset.contract_address,
    tokenId: asset.token_id,
    name: asset.name,
    collection: _.toLower(asset.contract_address),
    // Token descriptions are a waste of space for most collections we deal with
    // so by default we ignore them (this behaviour can be overridden if needed).
    description: asset.description,
    imageUrl: asset.image_url,
    imageOriginalUrl: asset.extra_metadata.image_original_url,
    imageSmallUrl: asset.previews.image_small_url,
    imageMediumUrl: asset.previews.image_medium_url,
    imageLargeUrl: asset.previews.image_large_url,
    mediaUrl: asset.video_url,
    attributes: (asset.extra_metadata.attributes || []).map((trait) => ({
      key: trait.trait_type,
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    })),
  };
};
