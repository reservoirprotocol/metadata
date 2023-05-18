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
import * as feralFile from "./feral-file";
import * as tfoust from "./tfoust";
import * as sharedContracts from "./shared-contracts";
import * as cyberkongz from "./cyberkongz";
import * as emblemVault from "./emblem-vault";
import * as brainDrops from "./braindrops";
import * as quantumArt from "./quantum-art";
import * as shreddingSassy from "./shredding-sassy";
import * as openseaSharedContract from "./opensea-shared-contract";
import * as artblocks from "./artblocks";
import * as artblocksEngine from "./artblocks-engine";
import * as mirageGalleryCurated from "./mirage-gallery-curated";
import * as forgottenPonies from "./forgotten-ponies";
import * as forgottenRunes from "./forgotten-runes";
import * as forgottenSouls from "./forgotten-souls";
import * as forgottenRunesWarriors from "./forgotten-runes-warriors";
import * as forgottenRunesAthenaeum from "./forgotten-runes-athenaeum";

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
      return extend[`${chainId},${metadata.contract.toLowerCase()}`].extend(chainId, metadata);
    } else {
      return metadata;
    }
  }
};

const extendCollection = {};

// Opensea Shared Contract
extendCollection["1,0x495f947276749ce646f68ac8c248420045cb7b5e"] = openseaSharedContract;
extendCollection["1,0x503a3039e9ce236e9a12e4008aecbb1fd8b384a3"] = openseaSharedContract;
extendCollection["1,0xd78afb925a21f87fa0e35abae2aead3f70ced96b"] = openseaSharedContract;
extendCollection["1,0xb6329bd2741c4e5e91e26c4e653db643e74b2b19"] = openseaSharedContract;
extendCollection["1,0xd8b7cc75e22031a72d7b8393113ef2536e17bde6"] = openseaSharedContract;
extendCollection["1,0x2d820afb710681580a55ca8077b57fba6dd9fd72"] = openseaSharedContract;
extendCollection["1,0x0faed6ddef3773f3ee5828383aaeeaca2a94564a"] = openseaSharedContract;
extendCollection["1,0x13927739076014913a3a7c207ef84c5be4780014"] = openseaSharedContract;
extendCollection["1,0x7a15b36cb834aea88553de69077d3777460d73ac"] = openseaSharedContract;
// extendCollection["137,0x2953399124f0cbb46d2cbacd8a89cf0599974963"] = openseaSharedContract;

// CyberKongz
extendCollection["1,0x57a204aa1042f6e66dd7730813f4024114d74f37"] = cyberkongz;

// Admit One
extendCollection["1,0xd2a077ec359d94e0a0b7e84435eacb40a67a817c"] = admitOne;
extendCollection["4,0xa7d49d78ab0295ad5a857dc4d0ab16445663ab85"] = admitOne;

// Art Tennis
extendCollection["1,0x4d928ab507bf633dd8e68024a1fb4c99316bbdf3"] = artTennis;

// Rarible ERC721
extendCollection["1,0xc9154424b823b10579895ccbe442d41b9abd96ed"] = sharedContracts;
extendCollection["5,0xd8560c88d1dc85f9ed05b25878e366c49b68bef9"] = sharedContracts;

// Rarible ERC1155
extendCollection["1,0xb66a603f4cfe17e3d27b87a8bfcad319856518b8"] = sharedContracts;
extendCollection["5,0x7c4b13b5893cd82f371c5e28f12fb2f37542bbc5"] = sharedContracts;

// Superrare
extendCollection["1,0xb932a70a57673d89f4acffbe830e8ed7f75fb9e0"] = sharedContracts;

// Foundation
extendCollection["1,0x3b3ee1931dc30c1957379fac9aba94d1c48a5405"] = sharedContracts;

// Zora
extendCollection["1,0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7"] = sharedContracts;

// Emblem Vault
extendCollection["1,0x82c7a8f707110f5fbb16184a5933e9f78a34c6ab"] = emblemVault;

// Feral File
extendCollection["1,0x2a86c5466f088caebf94e071a77669bae371cd87"] = feralFile;

// BrainDrops
extendCollection["1,0xdfde78d2baec499fe18f2be74b6c287eed9511d7"] = brainDrops;

// Quantum Art
extendCollection["1,0x46ac8540d698167fcbb9e846511beb8cf8af9bd8"] = quantumArt;

// ArtBlocks
extendCollection["1,0x059edd72cd353df5106d2b9cc5ab83a52287ac3a"] = artblocks;
extendCollection["1,0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270"] = artblocks;
extendCollection["1,0x99a9b7c1116f9ceeb1652de04d5969cce509b069"] = artblocks;
extendCollection["5,0xda62f67be7194775a75be91cbf9feedcc5776d4b"] = artblocks;
extendCollection["5,0xb614c578062a62714c927cd8193f0b8bfb90055c"] = artblocks;

// ArtBlocks Engine
extendCollection["1,0xbdde08bd57e5c9fd563ee7ac61618cb2ecdc0ce0"] = artblocksEngine;
extendCollection["1,0x28f2d3805652fb5d359486dffb7d08320d403240"] = artblocksEngine;
extendCollection["1,0x64780ce53f6e966e18a22af13a2f97369580ec11"] = artblocksEngine;
extendCollection["1,0x010be6545e14f1dc50256286d9920e833f809c6a"] = artblocksEngine;
extendCollection["1,0x13aae6f9599880edbb7d144bb13f1212cee99533"] = artblocksEngine;
extendCollection["1,0xa319c382a702682129fcbf55d514e61a16f97f9c"] = artblocksEngine;
extendCollection["1,0xd10e3dee203579fcee90ed7d0bdd8086f7e53beb"] = artblocksEngine;
extendCollection["1,0x62e37f664b5945629b6549a87f8e10ed0b6d923b"] = artblocksEngine;
extendCollection["1,0x0a1bbd57033f57e7b6743621b79fcb9eb2ce3676"] = artblocksEngine;
extendCollection["1,0x942bc2d3e7a589fe5bd4a5c6ef9727dfd82f5c8a"] = artblocksEngine;
extendCollection["1,0x32d4be5ee74376e08038d652d4dc26e62c67f436"] = artblocksEngine;

// Async Blueprints
extendCollection["1,0xc143bbfcdbdbed6d454803804752a064a622c1f3"] = asyncBlueprints;

// Mirage Gallery Curated
extendCollection["1,0xb7ec7bbd2d2193b47027247fc666fb342d23c4b5"] = mirageGalleryCurated;

const extend = {};

// Opensea Shared Contract
extend["1,0x495f947276749ce646f68ac8c248420045cb7b5e"] = openseaSharedContract;
extend["1,0x503a3039e9ce236e9a12e4008aecbb1fd8b384a3"] = openseaSharedContract;
extend["1,0xd78afb925a21f87fa0e35abae2aead3f70ced96b"] = openseaSharedContract;
extend["1,0xb6329bd2741c4e5e91e26c4e653db643e74b2b19"] = openseaSharedContract;
extend["1,0xd8b7cc75e22031a72d7b8393113ef2536e17bde6"] = openseaSharedContract;
extend["1,0x2d820afb710681580a55ca8077b57fba6dd9fd72"] = openseaSharedContract;
extend["1,0x0faed6ddef3773f3ee5828383aaeeaca2a94564a"] = openseaSharedContract;
extend["1,0x13927739076014913a3a7c207ef84c5be4780014"] = openseaSharedContract;
extend["1,0x7a15b36cb834aea88553de69077d3777460d73ac"] = openseaSharedContract;
// extend["137,0x2953399124f0cbb46d2cbacd8a89cf0599974963"] = openseaSharedContract;

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
soundxyz.SoundxyzArtistContracts.forEach((address) => (extend[`1,${address}`] = soundxyzExtend));
soundxyz.SoundxyzReleaseContracts.forEach((address) => (extend[`1,${address}`] = soundxyzExtend));
extend["5,0xbe8f3dfce2fcbb6dd08a7e8109958355785c968b"] = soundxyzExtend;

// Async Blueprints
extend["1,0xc143bbfcdbdbed6d454803804752a064a622c1f3"] = asyncBlueprints;

// tfoust
tfoust.CollectiblesCollections.forEach((c) => (extend[`137,${c}`] = tfoust));

// Emblem Vault
extend["1,0x82c7a8f707110f5fbb16184a5933e9f78a34c6ab"] = emblemVault;

// Feral File
extend["1,0x2a86c5466f088caebf94e071a77669bae371cd87"] = feralFile;

// BrainDrops
extend["1,0xdfde78d2baec499fe18f2be74b6c287eed9511d7"] = brainDrops;

// Quantum Art
extend["1,0x46ac8540d698167fcbb9e846511beb8cf8af9bd8"] = quantumArt;

// Shredding Sassy
extend["1,0x165BD6E2ae984D9C13D94808e9A6ba2b7348c800"] = shreddingSassy;

// ArtBlocks
extend["1,0x059edd72cd353df5106d2b9cc5ab83a52287ac3a"] = artblocks;
extend["1,0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270"] = artblocks;
extend["1,0x99a9b7c1116f9ceeb1652de04d5969cce509b069"] = artblocks;
extend["5,0xda62f67be7194775a75be91cbf9feedcc5776d4b"] = artblocks;
extend["5,0xb614c578062a62714c927cd8193f0b8bfb90055c"] = artblocks;

// ArtBlocks Engine
extend["1,0xbdde08bd57e5c9fd563ee7ac61618cb2ecdc0ce0"] = artblocksEngine;
extend["1,0x28f2d3805652fb5d359486dffb7d08320d403240"] = artblocksEngine;
extend["1,0x64780ce53f6e966e18a22af13a2f97369580ec11"] = artblocksEngine;
extend["1,0x010be6545e14f1dc50256286d9920e833f809c6a"] = artblocksEngine;
extend["1,0x13aae6f9599880edbb7d144bb13f1212cee99533"] = artblocksEngine;
extend["1,0xa319c382a702682129fcbf55d514e61a16f97f9c"] = artblocksEngine;
extend["1,0xd10e3dee203579fcee90ed7d0bdd8086f7e53beb"] = artblocksEngine;
extend["1,0x62e37f664b5945629b6549a87f8e10ed0b6d923b"] = artblocksEngine;
extend["1,0x0a1bbd57033f57e7b6743621b79fcb9eb2ce3676"] = artblocksEngine;
extend["1,0x942bc2d3e7a589fe5bd4a5c6ef9727dfd82f5c8a"] = artblocksEngine;
extend["1,0x32d4be5ee74376e08038d652d4dc26e62c67f436"] = artblocksEngine;

// Mirage Gallery Curated
extend["1,0xb7ec7bbd2d2193b47027247fc666fb342d23c4b5"] = mirageGalleryCurated;

// Forgotten Runes
extend["1,0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42"] = forgottenRunes;

// Forgotten Runes Warriors
extend["1,0x9690b63eb85467be5267a3603f770589ab12dc95"] = forgottenRunesWarriors;

// Forgotten Souls
extend["1,0x251b5f14a825c537ff788604ea1b58e49b70726f"] = forgottenSouls;

// Forgotten Ponies
extend["1,0xf55b615b479482440135ebf1b907fd4c37ed9420"] = forgottenPonies;

// Forgotten Runes Athenaeum
extend["1,0x7c104b4db94494688027cced1e2ebfb89642c80f"] = forgottenRunesAthenaeum;
