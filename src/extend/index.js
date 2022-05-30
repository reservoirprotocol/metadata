import * as adidasOriginals from "./adidas-originals";
import * as admitOne from "./admit-one";
import * as mutantApeYachtClub from "./mutant-ape-yacht-club";
import * as nouns from "./nouns";
import * as lilnouns from "./lilnouns";

export const extendCollectionMetadata = async (chainId, metadata) => {
  if (metadata) {
    if (Boolean(extendCollection[`${chainId},${metadata.id}`])) {
      return extendCollection[`${chainId},${metadata.id}`].extendCollection(
        chainId,
        metadata
      );
    } else {
      return metadata;
    }
  }
};

export const extendMetadata = async (chainId, metadata) => {
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

const extendCollection = {};

// Admit One
extendCollection["1,0xd2a077ec359d94e0a0b7e84435eacb40a67a817c"] = admitOne;
extendCollection["4,0xa7d49d78ab0295ad5a857dc4d0ab16445663ab85"] = admitOne;

const extend = {};

// Adidas Originals
extend["1,0x28472a58a490c5e09a238847f66a68a47cc76f0f"] = adidasOriginals;

// Mutant Ape Yacht Club
extend["1,0x60e4d786628fea6478f785a6d7e704777c86a7c6"] = mutantApeYachtClub;

// Nouns
extend["1,0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03"] = nouns;
extend["1,0x4b10701bfd7bfedc47d50562b76b436fbb5bdb3b"] = lilnouns;
