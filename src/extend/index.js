import * as adidasOriginals from "./adidas-originals";

export const extendMetadata = (chainId, metadata) => {
  if (metadata) {
    if (Boolean(extend[`${chainId},${metadata.contract}`])) {
      return extend[`${chainId},${metadata.contract}`].extend(
        chainId,
        metadata
      );
    } else {
      return metadata;
    }
  }
};

const extend = {};

// Adidas Originals
extend["1,0x28472a58a490c5e09a238847f66a68a47cc76f0f"] = adidasOriginals;
