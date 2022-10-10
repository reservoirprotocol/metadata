import _ from "lodash";

export const parse = (asset) => {
  return {
    contract: asset.asset_contract.address,
    tokenId: asset.token_id,
    collection: _.toLower(asset.asset_contract.address),
    name: asset.name,
    flagged: !asset.supports_wyvern,
    // Token descriptions are a waste of space for most collections we deal with
    // so by default we ignore them (this behaviour can be overridden if needed).
    description: asset.description,
    imageUrl: asset.image_url,
    mediaUrl: asset.animation_url,
    attributes: (asset.traits || []).map((trait) => ({
      key: trait.trait_type,
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    })),
  };
};
