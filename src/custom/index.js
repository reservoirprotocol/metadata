import * as loot from "./loot";

export const hasCustomHandler = (chainId, contract) => {
  switch (`${chainId},${contract}`) {
    // Loot
    case "1,0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7":
    case "2,0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78":
      return true;
  }

  return false;
};

export const customHandleToken = async (chainId, token) => {
  switch (`${chainId},${contract}`) {
    // Loot
    case "1,0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7":
    case "2,0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78":
      return loot.fetchToken(chainId, token);
  }
};

export const customHandleContractTokens = async (
  chainId,
  contract,
  continuation
) => {
  switch (`${chainId},${contract}`) {
    // Loot
    case "1,0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7":
    case "2,0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78":
      return loot.fetchContractTokens(chainId, contract, continuation);
  }
};
