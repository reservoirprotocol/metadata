import { providers } from "ethers";

export const getProvider = (chainId) => {
  return new providers.AlchemyProvider(chainId, process.env.ALCHEMY_API_KEY);
};

export const supportedChains = process.env.SUPPORTED_CHAINS.split(",").reduce(
  (acc, val) => ((acc[val.split(":")[1]] = Number(val.split(":")[0])), acc),
  {}
);
