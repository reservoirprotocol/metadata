import nouns from "./nouns.json";
import { request, gql } from 'graphql-request'

const capitalizeFirstLetter = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const extend = async (_chainId, metadata) => {
  let traitMap = ["background","body","accessory","head","glasses"]
  let data = await request('https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph', gql`{
    nouns(where: {id: "${metadata.tokenId}"}) {
      seed {
        background
        body
        accessory
        head
        glasses
      }
    }
  }`);
  let traits = []
  for(let i in traitMap) {
    traits.push({
      key: capitalizeFirstLetter(traitMap[i]),
      value: nouns[i][data.nouns[0].seed[traitMap[i]]],
      kind: "string",
      rank: 5-i,
    })
  }
  console.log(traits)
  return {
    ...metadata,
    attributes: traits
  };
};
