import _ from "lodash";

export const parse = (asset) => {
  try {
    // Image
    let imageUrl = null;
    if (!imageUrl) {
      imageUrl = asset.meta?.image?.url?.["PREVIEW"];
    }
    if (!imageUrl) {
      imageUrl = asset.meta?.image?.url?.["BIG"];
    }
    if (!imageUrl) {
      imageUrl = asset.meta?.image?.url?.["ORIGINAL"];
    }

    // Media
    let mediaUrl = null;
    if (!mediaUrl) {
      mediaUrl = asset.meta?.animation?.url?.["ORIGINAL"];
    }

    // Attributes
    const attributes = asset.meta.attributes?.reduce((result, trait) => {
      if (trait.value) {
        result.push({
          key: trait.key ?? "property",
          value: trait.value,
          kind: isNaN(trait.value) ? "string" : "number",
          rank: 1,
        });
      }
      return result;
    }, []);

    // Token descriptions are a waste of space for most collections we deal with
    // so by default we ignore them (this behaviour can be overridden if needed).
    return {
      contract: asset.contract,
      tokenId: asset.tokenId,
      collection: _.toLower(asset.contract),
      name: asset.meta.name,
      imageUrl,
      mediaUrl,
      attributes,
    };
  } catch {
    // Skip any errors
  }

  return undefined;
};
