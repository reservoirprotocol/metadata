import _ from "lodash";

import * as opensea from "../../fetchers/opensea";

import wizards from "./wizards.json";

const rank = {
  Head: 14,
  Body: 13,
  Familiar: 12,
  Prop: 11,
  Rune: 10,
  Background: 9,
  Affinity: 8,
  "% Traits in Affinity": 7,
  "# Traits in Affinity": 6,
  "# Traits": 5,
  Title: 4,
  Name: 3,
  Origin: 2,
};

export const fetchToken = async (chainId, { contract, tokenId }) => {
  const result = {
    contract,
    tokenId,
    collection: _.toLower(contract),
    name: wizards[tokenId]["FullName"],
    imageUrl: `https://bafybeigjl2wwcakyvqd4s6odmmyy3lqxiyffv3wk4su5p5bincksxgga2a.ipfs.infura-ipfs.io/${tokenId}.png`,
    flagged: await opensea
      .fetchTokens(chainId, [{ contract, tokenId }])
      .then((t) => t[0].flagged)
      .catch(() => false),
    attributes: [],
  };

  for (const trait of Object.keys(wizards[tokenId])) {
    let value = "";
    if (trait == "% Traits in Affinity") {
      value = wizards[tokenId][trait].slice(0, -1);
    } else {
      value = wizards[tokenId][trait];
    }

    if (trait != "FullName") {
      result.attributes.push({
        key: trait,
        rank: rank[trait],
        value: value,
        kind: "string",
      });
    }
  }

  return result;
};

export const fetchContractTokens = (_chainId, contract, continuation) => {
  const pageSize = 1000;
  const tokenIdRange = [0, 9999];

  const minTokenId = continuation ? Math.max(continuation, tokenIdRange[0]) : tokenIdRange[0];
  const maxTokenId = continuation
    ? Math.min(continuation + pageSize, tokenIdRange[1])
    : tokenIdRange[1];

  const assets = [];
  for (let tokenId = minTokenId; tokenId <= maxTokenId; tokenId++) {
    assets.push(fetchToken(_chainId, { contract, tokenId }));
  }

  return {
    continuation: maxTokenId === tokenIdRange[1] ? undefined : maxTokenId + 1,
    metadata,
  };
};
