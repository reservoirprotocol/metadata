import { providers } from "ethers";

export const getProvider = (chainId) => {
  return new providers.AlchemyProvider(chainId, process.env.ALCHEMY_API_KEY);
};

const chainObject = (chains) => chains.split(",").reduce(
  (acc, val) => ((acc[val.split(":")[0]] = Number(val.split(":")[1])), acc),
  {}
);

export const chains = chainObject(process.env.CHAINS);
export const simplehash_chains = chainObject(process.env.SIMPLEHASH_CHAINS);
export const onchain_chains = chainObject(process.env.ONCHAIN_CHAINS);
