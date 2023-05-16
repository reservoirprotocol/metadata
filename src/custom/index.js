import * as cryptokicksIrl from "./cryptokicks-irl";
import * as forgottenRunesAthenaeum from "./forgotten-runes-athenaeum";
import * as forgottenRunesWarriors from "./forgotten-runes-warriors";
import * as goldfinch from "./goldfinch";
import * as loot from "./loot";
import * as soundxyz from "./soundxyz";

export const hasCustomCollectionHandler = (chainId, contract) =>
  Boolean(customCollection[`${chainId},${contract}`]);

export const hasCustomHandler = (chainId, contract) => Boolean(custom[`${chainId},${contract}`]);

// All of the below methods assume the caller ensured that a custom
// handler exists (eg. via calling the above check methods)

export const customHandleCollection = async (chainId, token) =>
  customCollection[`${chainId},${token.contract}`].fetchCollection(chainId, token);

export const customHandleToken = async (chainId, token) =>
  custom[`${chainId},${token.contract}`].fetchToken(chainId, token);

export const customHandleContractTokens = async (chainId, contract, continuation) =>
  custom[`${chainId},${contract}`].fetchContractTokens(
    null,
    chainId, // todo is this wrong order?
    continuation
  );

/////////////////////
// Custom Collections
/////////////////////

const customCollection = {};

// Sound XYZ
soundxyz.SoundxyzArtistContracts.forEach(
  (address) => (customCollection[`1,${address}`] = soundxyz)
);
soundxyz.SoundxyzReleaseContracts.forEach(
  (address) => (customCollection[`1,${address}`] = soundxyz)
);
customCollection["5,0xbe8f3dfce2fcbb6dd08a7e8109958355785c968b"] = soundxyz;

////////////////
// Custom Tokens
////////////////

const custom = {};

// Cryptokicks IRL
custom["1,0x11708dc8a3ea69020f520c81250abb191b190110"] = cryptokicksIrl;

// Forgotten Runes Warriors
custom["1,0x9690b63eb85467be5267a3603f770589ab12dc95"] = forgottenRunesWarriors;

// Forgotten Runes Athenaeum
custom["1,0x7c104b4db94494688027cced1e2ebfb89642c80f"] = forgottenRunesAthenaeum;

// Goldfinch
custom["1,0x57686612c601cb5213b01aa8e80afeb24bbd01df"] = goldfinch;

// Loot
custom["1,0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7"] = loot;
custom["4,0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78"] = loot;

