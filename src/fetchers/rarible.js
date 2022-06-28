import axios from "axios";

import { parse } from "../parsers/rarible";

export const fetchCollection = async (_chainId, _token) => {
  // TODO: To implement
  return null;
};

export const fetchTokens = async (chainId, tokens) => {
  const url =
    chainId === 1
      ? "https://ethereum-api.rarible.org/v0.1/nft/items/byIds"
      : "https://ethereum-api-staging.rarible.org/v0.1/nft/items/byIds";
  const data = await axios
    .post(url, {
      ids: tokens.map(({ contract, tokenId }) => `${contract}:${tokenId}`),
    })
    .then((response) => response.data);

  return data.map(parse).filter(Boolean);
};

export const fetchContractTokens = async (chainId, contract, continuation) => {
  const searchParams = new URLSearchParams();
  searchParams.append("collection", contract);
  searchParams.append("size", 1000);
  if (continuation) {
    searchParams.append("continuation", continuation);
  }

  const url =
    chainId === 1
      ? `https://ethereum-api.rarible.org/v0.1/nft/items/byCollection?${searchParams.toString()}`
      : `https://ethereum-api-staging.rarible.org/v0.1/nft/items/byCollection?${searchParams.toString()}`;
  const data = await axios.get(url).then((response) => response.data);

  return {
    continuation: data.continuation,
    metadata: data.items.map(parse).filter(Boolean),
  };
};
