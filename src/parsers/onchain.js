import _ from "lodash";

export const parse = (asset) => {
  return {
    contract: asset.contract,
    tokenId: asset.token_id,
    collection: _.toLower(asset.contract),
    name: asset?.name || null,
    flagged: null,
    // Token descriptions are a waste of space for most collections we deal with
    // so by default we ignore them (this behaviour can be overridden if needed).
    description: asset.description || null,
    imageUrl: normalizeLink(asset?.image) || null,
    imageOriginalUrl: asset?.image || null,
    mediaUrl: normalizeLink(asset?.animation_url) || null,
    attributes: (asset.attributes || []).map((trait) => ({
      key: trait.trait_type ?? "property",
      value: trait.value,
      kind: typeof trait.value == "number" ? "number" : "string",
      rank: 1,
    })),
  };
};

export const normalizeLink = (link) => {
  if (!link) return null;
  if (link.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${link.slice(7)}`;
  }

  return link;
};
