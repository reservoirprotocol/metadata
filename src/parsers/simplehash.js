import _ from "lodash";

export const parse = (asset) => {
  const {
    image_original_url,
    animation_original_url,
    metadata_original_url,
    attributes,
    ...original_metadata
  } = asset.extra_metadata;

  return {
    contract: _.toLower(asset.contract_address),
    tokenId: asset.token_id,
    name: asset.name,
    collection: _.toLower(asset.contract_address),
    slug:
      asset.collection.marketplace_pages.filter((market) => market.marketplace_id === "opensea")[0]
        ?.marketplace_collection_id ?? undefined,
    // Token descriptions are a waste of space for most collections we deal with
    // so by default we ignore them (this behaviour can be overridden if needed).
    description: asset.description,
    originalMetadata: original_metadata,
    imageUrl: asset.previews?.image_medium_url ?? asset.image_url,
    imageOriginalUrl: image_original_url,
    animationOriginalUrl: animation_original_url,
    metadataOriginalUrl: metadata_original_url,
    imageProperties: asset.image_properties,
    mediaUrl: asset.video_url,
    attributes: (attributes || []).map((trait) => ({
      key: trait.trait_type ?? "property",
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    })),
  };
};
