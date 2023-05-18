import _ from "lodash";

export const parse = (asset) => {
  return {
    contract: asset.asset_contract.address,
    tokenId: asset.token_id,
    collection: _.toLower(asset.asset_contract.address),
    slug: asset.collection.slug,
    name: asset.name,
    flagged: asset.supports_wyvern != null ? !asset.supports_wyvern : undefined,
    // Token descriptions are a waste of space for most collections we deal with
    // so by default we ignore them (this behaviour can be overridden if needed).
    description: asset.description,
    imageUrl: asset.image_url,
    imageOriginalUrl: asset.image_original_url,
    imageSmallUrl: asset.image_preview_url.replace(/w=\d+/, `w=${250}`) || null,
    imageMediumUrl: asset.image_preview_url.replace(/w=\d+/, `w=${512}`) || null,
    imageLargeUrl: asset.image_preview_url.replace(/w=\d+/, `w=${1000}`) || null,
    mediaUrl: asset.animation_url,
    attributes: (asset.traits || []).map((trait) => ({
      key: trait.trait_type,
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    })),
  };
};
