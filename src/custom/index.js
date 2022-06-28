import * as artblocks from "./artblocks";
import * as forgottenPonies from "./forgotten-ponies";
import * as forgottenRunes from "./forgotten-runes";
import * as forgottenSouls from "./forgotten-souls";
import * as forgottenRunesWarriors from "./forgotten-runes-warriors";
import * as loot from "./loot";

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
    token,
    continuation
  );

const customCollection = {};

// ArtBlocks
customCollection["1,0x059edd72cd353df5106d2b9cc5ab83a52287ac3a"] = artblocks;
customCollection["1,0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270"] = artblocks;

const custom = {};

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
