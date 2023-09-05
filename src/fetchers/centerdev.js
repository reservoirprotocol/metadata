import axios from "axios";
import { Contract } from "ethers";
import { Interface } from "ethers/lib/utils";

import { parse } from "../parsers/centerdev";
import { getProvider } from "../shared/utils";
import { logger } from "../shared/logger";

const getNetworkName = (chainId) => {
  let network;
  if (chainId === 1) {
    network = "ethereum-mainnet";
  } else if (chainId === 4) {
    network = "ethereum-rinkeby";
  } else if (chainId === 5) {
    network = "ethereum-goerli";
  } else if (chainId === 10) {
    network = "optimism-mainnet";
  } else if (chainId === 137) {
    network = "polygon-mainnet";
  } else {
    throw new Error("Unsupported chain id");
  }

  return network;
};

export const fetchCollection = async (chainId, { contract, tokenId }) => {
  try {
    const network = getNetworkName(chainId);
    const url = `https://api.center.dev/v1/${network}/${contract}`;

    const data = await axios
      .get(url, {
        headers: { "X-API-KEY": process.env.CENTERDEV_API_KEY.trim() },
      })
      .then((response) => response.data);

    return {
      id: contract,
      slug: null,
      name: data.name,
      community: null,
      metadata: null,
      contract,
      tokenIdRange: null,
      tokenSetId: `contract:${contract}`,
    };
  } catch {
    try {
      const name = await new Contract(
        contract,
        new Interface(["function name() view returns (string)"]),
        getProvider(chainId)
      ).name();

      return {
        id: contract,
        slug: null,
        name: name,
        community: null,
        metadata: null,
        contract,
        tokenIdRange: null,
        tokenSetId: `contract:${contract}`,
        isFallback: true,
      };
    } catch {
      return null;
    }
  }
};

export const fetchTokens = async (chainId, tokens) => {
  const network = getNetworkName(chainId);
  const url = `https://api.center.dev/v1/${network}/assets`;

  const data = await axios
    .post(
      url,
      {
        assets: tokens.map(({ contract, tokenId }) => {
          return { Address: contract, TokenID: tokenId };
        }),
      },
      {
        headers: { "X-API-KEY": process.env.CENTERDEV_API_KEY.trim() },
      }
    )

    .then((response) => response.data)
    .catch((error) => {
      logger.error(
        "centerdev-fetcher",
        `fetchTokens error. chainId:${chainId}, message:${error.message},  status:${
          error.response?.status
        }, data:${JSON.stringify(error.response?.data)}`
      );

      throw error;
    });

  return data.map(parse).filter(Boolean);
};

export const fetchContractTokens = async (chainId, contract, continuation) => {
  // TODO: To implement
  return null;
};
