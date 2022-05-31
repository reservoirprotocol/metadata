import { request, gql } from "graphql-request";
import { utils } from 'ethers'

import nouns from "./nouns.json";

const capitalizeFirstLetter = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const extend = async (_chainId, metadata) => {
  const traitMap = ["background", "body", "accessory", "head", "glasses"];
  const data = await request(
    "https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph",
    gql`{
      auctions(where:{id: "${metadata.tokenId}"}) {
        amount
      }
      nouns(where:{id: "${metadata.tokenId}"}) {
        seed {
          background
          body
          accessory
          head
          glasses
        }
      }
    }`
  );

  const traits = [];
  if(data.auctions[0]) {
    traits.push({
      key: 'Auction Price',
      value: utils.formatEther(data.auctions[0].amount),
      kind: "string",
      rank: 1,
    });
  }
  for (let i in traitMap) {
    traits.push({
      key: capitalizeFirstLetter(traitMap[i]),
      value: nouns[i][data.nouns[0].seed[traitMap[i]]],
      kind: "string",
      rank: 6 - i,
    });
  }

  return {
    ...metadata,
    attributes: traits,
  };
};
