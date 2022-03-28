import axios from "axios";

import { parse } from "../parsers/opensea";

export const fetchTokens = async (chainId, tokens) => {
  const searchParams = new URLSearchParams();
  for (const { contract, tokenId } of tokens) {
    searchParams.append("asset_contract_addresses", contract);
    searchParams.append("token_ids", tokenId);
  }

  const url =
    chainId === 1
      ? `https://api.opensea.io/api/v1/assets?${searchParams.toString()}`
      : `https://rinkeby-api.opensea.io/api/v1/assets?${searchParams.toString()}`;
  const data = await axios
    .get(url, {
      headers:
        chainId === 1
          ? {
              "X-API-KEY": process.env.OPENSEA_APIKEY.trim(),
            }
          : {},
    })
    .then((response) => response.data);

  return data.assets.map(parse).filter(Boolean);
};

export const fetchContractTokens = async (chainId, contract, continuation) => {
  const searchParams = new URLSearchParams();
  searchParams.append("asset_contract_address", contract);
  if (continuation) {
    searchParams.append("cursor", continuation);
  }

  const url =
    chainId === 1
      ? `https://api.opensea.io/api/v1/assets?${searchParams.toString()}`
      : `https://rinkeby-api.opensea.io/api/v1/assets?${searchParams.toString()}`;
  const data = await axios
    .get(url, {
      headers:
        chainId === 1
          ? {
              "X-API-KEY": process.env.OPENSEA_APIKEY.trim(),
            }
          : {},
    })
    .then((response) => response.data);

  return {
    continuation: data.next,
    metadata: data.assets.map(parse).filter(Boolean),
  };
};
