import * as cryptokicksIrl from "./cryptokicks-irl";
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
