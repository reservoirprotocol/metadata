import { request, gql } from "graphql-request";

import nouns from "./nouns.json";

const capitalizeFirstLetter = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const extend = async (_chainId, metadata) => {
  const traitMap = ["background", "body", "accessory", "head", "glasses"];
  const data = await request(
    "https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph",
    gql`{
      nouns(where: {id: "${metadata.tokenId}"}) {
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
  for (let i in traitMap) {
    traits.push({
      key: capitalizeFirstLetter(traitMap[i]),
      value: nouns[i][data.nouns[0].seed[traitMap[i]]],
      kind: "string",
      rank: 5 - i,
    });
  }

  return {
    ...metadata,
    attributes: traits,
  };
};
