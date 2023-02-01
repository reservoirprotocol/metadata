import * as adidasOriginals from "./adidas-originals";
import * as admitOne from "./admit-one";
import * as artTennis from "./art-tennis";
import * as mutantApeYachtClub from "./mutant-ape-yacht-club";
import * as boredApeKennelClub from "./bored-ape-kennel-club";
import * as nouns from "./nouns";
import * as lilnouns from "./lilnouns";
import * as chimpers from "./chimpers";
import * as moonbirds from "./moonbirds";
import * as soundxyz from "../custom/soundxyz";
import * as soundxyzExtend from "./soundxyz";
import * as bayc from "./bayc";
import * as asyncBlueprints from "./async-blueprints";
import * as tfoust from './tfoust';
import * as sharedContracts from "./shared-contracts";
import * as cyberkongz from "./cyberkongz";

export const extendCollectionMetadata = async (chainId, metadata, tokenId = null) => {
  if (metadata) {
    if (Boolean(extendCollection[`${chainId},${metadata.id}`])) {
      return extendCollection[`${chainId},${metadata.id}`].extendCollection(
        chainId,
        metadata,
        tokenId
      );
    } else {
      return metadata;
    }
  }
};

export const extendMetadata = async (chainId, metadata) => {
  if (metadata) {
    if (Boolean(extend[`${chainId},${metadata.contract.toLowerCase()}`])) {
      return extend[`${chainId},${metadata.contract.toLowerCase()}`].extend(
        chainId,
        metadata
      );
    } else {
      return metadata;
    }
  }
};

const extendCollection = {};

// CyberKongz
extendCollection["1,0x57a204aa1042f6e66dd7730813f4024114d74f37"] = cyberkongz;

// Admit One
extendCollection["1,0xd2a077ec359d94e0a0b7e84435eacb40a67a817c"] = admitOne;
extendCollection["4,0xa7d49d78ab0295ad5a857dc4d0ab16445663ab85"] = admitOne;

// Art Tennis
extendCollection["1,0x4d928ab507bf633dd8e68024a1fb4c99316bbdf3"] = artTennis;

// Rarible ERC721
extendCollection["1,0xc9154424b823b10579895ccbe442d41b9abd96ed"] =
  sharedContracts;
extendCollection["5,0xd8560c88d1dc85f9ed05b25878e366c49b68bef9"] =
  sharedContracts;

// Rarible ERC1155
extendCollection["1,0xb66a603f4cfe17e3d27b87a8bfcad319856518b8"] =
  sharedContracts;
extendCollection["5,0x7c4b13b5893cd82f371c5e28f12fb2f37542bbc5"] =
  sharedContracts;

// Superrare
extendCollection["1,0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0"] =
  sharedContracts;

// Foundation
extendCollection["1,0x3b3ee1931dc30c1957379fac9aba94d1c48a5405"] =
  sharedContracts;

const extend = {};

// CyberKongz
extend["1,0x57a204aa1042f6e66dd7730813f4024114d74f37"] = cyberkongz;

// Adidas Originals
extend["1,0x28472a58a490c5e09a238847f66a68a47cc76f0f"] = adidasOriginals;

// Mutant Ape Yacht Club
extend["1,0x60e4d786628fea6478f785a6d7e704777c86a7c6"] = mutantApeYachtClub;

// Bored Ape Kennel Club
extend["1,0xba30e5f9bb24caa003e9f2f0497ad287fdf95623"] = boredApeKennelClub;

// Bored Ape Yacht Club
extend["1,0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"] = bayc;

// Nouns
extend["1,0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03"] = nouns;
extend["1,0x4b10701bfd7bfedc47d50562b76b436fbb5bdb3b"] = lilnouns;

// Chimpers
extend["1,0x80336ad7a747236ef41f47ed2c7641828a480baa"] = chimpers;

// Moonbirds
extend["1,0x23581767a106ae21c074b2276d25e5c3e136a68b"] = moonbirds;

// Sound XYZ
soundxyz.SoundxyzArtistContracts.forEach(
  (address) => (extend[`1,${address}`] = soundxyzExtend)
);
soundxyz.SoundxyzReleaseContracts.forEach(
  (address) => (extend[`1,${address}`] = soundxyzExtend)
);
extend["5,0xbe8f3dfce2fcbb6dd08a7e8109958355785c968b"] = soundxyzExtend;

// Async Blueprints
extend["1,0xc143bbfcdbdbed6d454803804752a064a622c1f3"] = asyncBlueprints;

// tfoust
extend["137,0x907808732079863886443057c65827a0f1c64357"] = tfoust;
extend["137,0xe1b5e23fdbc003aec16e6e79726a0b5f75ff93f5"] = tfoust;
extend["137,0x5846728730366d686cdc95dae80a70b44ec9eab2"] = tfoust;
extend["137,0x45308788743bbdae5de7ba9e565c0502d0ebb81f"] = tfoust;
