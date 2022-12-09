import * as artblocks from "./artblocks";
import * as artblocksEngine from "./artblocks-engine";
import * as forgottenPonies from "./forgotten-ponies";
import * as forgottenRunes from "./forgotten-runes";
import * as forgottenSouls from "./forgotten-souls";
import * as forgottenRunesWarriors from "./forgotten-runes-warriors";
import * as forgottenRunesAthenaeum from "./forgotten-runes-athenaeum";
import * as loot from "./loot";
import * as goldfinch from "./goldfinch";
import * as soundxyz from "./soundxyz";

export const hasCustomCollectionHandler = (chainId, contract) =>
  Boolean(customCollection[`${chainId},${contract}`]);

export const hasCustomHandler = (chainId, contract) =>
  Boolean(custom[`${chainId},${contract}`]);

// All of the below methods assume the caller ensured that a custom
// handler exists (eg. via calling the above check methods)

export const customHandleCollection = async (chainId, token) =>
  customCollection[`${chainId},${token.contract}`].fetchCollection(
    chainId,
    token
  );

export const customHandleToken = async (chainId, token) =>
  custom[`${chainId},${token.contract}`].fetchToken(chainId, token);

export const customHandleContractTokens = async (
  chainId,
  contract,
  continuation
) =>
  custom[`${chainId},${contract}`].fetchContractTokens(
    null,
    chainId,
    continuation
  );

///////////////////////
// Custom Collections
///////////////////////

const customCollection = {};

// ArtBlocks
customCollection["1,0x059edd72cd353df5106d2b9cc5ab83a52287ac3a"] = artblocks;
customCollection["1,0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270"] = artblocks;
customCollection["1,0x99a9b7c1116f9ceeb1652de04d5969cce509b069"] = artblocks;
customCollection["5,0xda62f67be7194775a75be91cbf9feedcc5776d4b"] = artblocks;
customCollection["5,0xb614c578062a62714c927cd8193f0b8bfb90055c"] = artblocks;

// Sound XYZ
soundxyz.SoundxyzArtistContracts.forEach((address) => customCollection[`1,${address}`] = soundxyz);
soundxyz.SoundxyzReleaseContracts.forEach((address) => customCollection[`1,${address}`] = soundxyz);
customCollection["5,0xbe8f3dfce2fcbb6dd08a7e8109958355785c968b"] = soundxyz;

///////////////////////
// Custom Tokens
///////////////////////

// ArtBlocks Engine
customCollection["1,0xbdde08bd57e5c9fd563ee7ac61618cb2ecdc0ce0"] = artblocksEngine;
customCollection["1,0x28f2d3805652fb5d359486dffb7d08320d403240"] = artblocksEngine;
customCollection["1,0x64780ce53f6e966e18a22af13a2f97369580ec11"] = artblocksEngine;
customCollection["1,0x010be6545e14f1dc50256286d9920e833f809c6a"] = artblocksEngine;
customCollection["1,0x13aae6f9599880edbb7d144bb13f1212cee99533"] = artblocksEngine;
customCollection["1,0xa319c382a702682129fcbf55d514e61a16f97f9c"] = artblocksEngine;
customCollection["1,0xd10e3dee203579fcee90ed7d0bdd8086f7e53beb"] = artblocksEngine;
customCollection["1,0x62e37f664b5945629b6549a87f8e10ed0b6d923b"] = artblocksEngine;
customCollection["1,0x0a1bbd57033f57e7b6743621b79fcb9eb2ce3676"] = artblocksEngine;
customCollection["1,0x942bc2d3e7a589fe5bd4a5c6ef9727dfd82f5c8a"] = artblocksEngine;

const custom = {};

// ArtBlocks
custom["1,0x059edd72cd353df5106d2b9cc5ab83a52287ac3a"] = artblocks;
custom["1,0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270"] = artblocks;
custom["1,0x99a9b7c1116f9ceeb1652de04d5969cce509b069"] = artblocks;
custom["5,0xda62f67be7194775a75be91cbf9feedcc5776d4b"] = artblocks;
custom["5,0xb614c578062a62714c927cd8193f0b8bfb90055c"] = artblocks;

// ArtBlocks Engine
custom["1,0xbdde08bd57e5c9fd563ee7ac61618cb2ecdc0ce0"] = artblocksEngine;
custom["1,0x28f2d3805652fb5d359486dffb7d08320d403240"] = artblocksEngine;
custom["1,0x64780ce53f6e966e18a22af13a2f97369580ec11"] = artblocksEngine;
custom["1,0x010be6545e14f1dc50256286d9920e833f809c6a"] = artblocksEngine;
custom["1,0x13aae6f9599880edbb7d144bb13f1212cee99533"] = artblocksEngine;
custom["1,0xa319c382a702682129fcbf55d514e61a16f97f9c"] = artblocksEngine;
custom["1,0xd10e3dee203579fcee90ed7d0bdd8086f7e53beb"] = artblocksEngine;
custom["1,0x62e37f664b5945629b6549a87f8e10ed0b6d923b"] = artblocksEngine;
custom["1,0x0a1bbd57033f57e7b6743621b79fcb9eb2ce3676"] = artblocksEngine;
custom["1,0x942bc2d3e7a589fe5bd4a5c6ef9727dfd82f5c8a"] = artblocksEngine;

// Loot
custom["1,0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7"] = loot;
custom["4,0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78"] = loot;

// Forgotten Ponies
custom["1,0xf55b615b479482440135ebf1b907fd4c37ed9420"] = forgottenPonies;

// Forgotten Runes
custom["1,0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42"] = forgottenRunes;

// Forgotten Souls
custom["1,0x251b5f14a825c537ff788604ea1b58e49b70726f"] = forgottenSouls;

// Forgotten Runes Warriors
custom["1,0x9690b63eb85467be5267a3603f770589ab12dc95"] = forgottenRunesWarriors;

// Forgotten Runes Athenaeum
custom["1,0x7c104b4db94494688027cced1e2ebfb89642c80f"] = forgottenRunesAthenaeum;

// Goldfinch
custom["1,0x57686612c601cb5213b01aa8e80afeb24bbd01df"] = goldfinch;
