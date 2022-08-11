import { providers } from "ethers";

export const getProvider = (chainId) => {
  return new providers.AlchemyProvider(chainId, process.env.ALCHEMY_API_KEY);
};
