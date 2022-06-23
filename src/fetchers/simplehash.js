import axios from "axios";

import { parse } from "../parsers/simplehash";

export const fetchTokens = async (chainId, tokens) => {
  const searchParams = new URLSearchParams();
  const nft_ids = tokens.map(
    ({ contract, tokenId }) => `optimism.${contract}.${tokenId}`
  );
  searchParams.append("nft_ids", nft_ids.join(","));

  const url = `https://api.simplehash.com/api/v0/nfts/assets?${searchParams.toString()}`;

  const data = await axios
    .get(url, {
      headers:
        chainId === 10
          ? {
              "X-API-KEY": process.env.SIMPLEHASH_API_KEY.trim(),
            }
          : {},
    })
    .then((response) => response.data);
  return data.nfts.map(parse).filter(Boolean);
};

export const fetchContractTokens = async (chainId, contract, continuation) => {
  const searchParams = new URLSearchParams();
  if (continuation) {
    searchParams.append("cursor", continuation);
  }

  const url = `https://api.simplehash.com/api/v0/nfts/optimism/${contract}?${searchParams.toString()}`;
  const data = await axios
    .get(url, {
      headers:
        chainId === 10
          ? {
              "X-API-KEY": process.env.SIMPLEHASH_API_KEY.trim(),
            }
          : {},
    })
    .then((response) => response.data);

  return {
    continuation: data.next,
    metadata: data.nfts.map(parse).filter(Boolean),
  };
};
