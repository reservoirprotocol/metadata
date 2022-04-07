import * as forgottenPonies from "./forgotten-ponies";
import * as forgottenRunes from "./forgotten-runes";
import * as forgottenSouls from "./forgotten-souls";
import * as loot from "./loot";

export const hasCustomHandler = (chainId, contract) =>
  Boolean(custom[`${chainId},${contract}`]);

// Both of the below methods assume the caller ensured a custom
// handler exists (eg. via calling the above `hasCustomHandler`).

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

// All custom handlers are to be defined below.

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
