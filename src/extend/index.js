import * as adidasOriginals from "./adidas-originals";
import * as mutantApeYachtClub from "./mutant-ape-yacht-club";

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

// Mutant Ape Yacht Club
extend["1,0x60e4d786628fea6478f785a6d7e704777c86a7c6"] = mutantApeYachtClub;
