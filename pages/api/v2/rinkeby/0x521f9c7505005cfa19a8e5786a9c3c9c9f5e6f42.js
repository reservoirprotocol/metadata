////////////////////
// Forgotten Runes Wizards Cult
////////////////////
const axios = require("axios");
let rank = {
  Head: 11,
  Body: 10,
  Familiar: 9,
  Prop: 8,
  Rune: 7,
  Background: 6,
  Affinity: 5,
  "% Traits in Affinity": 4,
  "# Traits in Affinity": 3,
  "# Traits": 2,
};

const api = async (req, res) => {
  if (req.query.token_ids) {
    let token_ids = Array.isArray(req.query.token_ids)
      ? req.query.token_ids
      : [req.query.token_ids];
    let data = await getBatch(token_ids);
    res.status(200).json(data);
  } else {
    res.status(200).json({ error: "Missing token_ids param" });
  }
};

async function getBatch(token_ids) {
  let promises = token_ids.map((token_id) => getToken(token_id));
  return Promise.all(promises).then((data) => {
    return data;
  });
}

async function getToken(id) {
  let url = `https://bafybeifd5ctqsiszoveqqtran7tvyg4xpjxu67nthf5n6ugdazeox5n5fa.ipfs.infura-ipfs.io/${id}`;
  return axios
    .get(url)
    .then((response) => {
      if (response.data) {
        let attributes = response.data.attributes.reduce((result, trait) => {
          if (trait.trait_type !== "Serial") {
            let trait_type = trait.trait_type.charAt(0).toUpperCase() + trait.trait_type.slice(1);
            let kind = "string";
            if (trait_type == "% Traits in Affinity") {
              trait.value = trait.value.slice(0, -1);
            }
            if (trait_type.indexOf("Traits") !== -1) {
              kind = "number";
            }
            result.push({
              key: trait_type,
              rank: rank[trait_type],
              value: trait.value,
              kind,
            });
          }
          return result;
        }, []);
        let meta = {
          token_id: id,
          name: response.data.name,
          description: null,
          image: `https://bafybeigjl2wwcakyvqd4s6odmmyy3lqxiyffv3wk4su5p5bincksxgga2a.ipfs.infura-ipfs.io/${id}.png`,
          community: "forgottenrunes",
          collection: {
            id: "forgottenruneswizardscult",
            setId: `contract:0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42`,
            name: "Forgotten Runes Wizards Cult",
            description:
              "The Forgotten Runes Wizard's Cult is a collaborative legendarium. 10,000 unique Wizard NFTs, fully encoded on-chain.",
            image:
              "https://lh3.googleusercontent.com/rfEd3YcRfS8Hk8YcZjD20Vrqu8XTazvnzklVN9pUcROrwhoLO8RbP0yiBQuemgGPpWMgEDGU7qO164x42GRn60Xv6aeFbdZkttzBjx8",
            royaltyBps: "250",
            royaltyRecipient: "0xd584fe736e5aad97c437c579e884d15b17a54a51",
            community: "forgottenrunes",
          },
          attributes: attributes,
        };
        return meta;
      } else {
        return { token_id: id, skip: false };
      }
    })
    .catch((error) => {
      console.log(error);
      return { token_id: id, skip: false };
    });
}

export default api;
