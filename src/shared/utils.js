import { providers } from "ethers";

export const getProvider = (chainId) => {
  return new providers.AlchemyProvider(chainId, process.env.ALCHEMY_API_KEY);
};

// Supported chains with key=network, value=chainId
export const supportedNetworks = process.env.SUPPORTED_CHAINS.split(",").reduce(
  (acc, val) => ((acc[val.split(":")[1]] = Number(val.split(":")[0])), acc),
  {}
);

// Supported chains with key=chainId, value=network
export const supportedChains = process.env.SUPPORTED_CHAINS.split(",").reduce(
  (acc, val) => ((acc[Number(val.split(":")[0])] = val.split(":")[1]), acc),
  {}
);
