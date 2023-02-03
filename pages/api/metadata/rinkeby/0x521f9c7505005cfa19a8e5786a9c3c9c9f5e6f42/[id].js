////////////////////
// Forgotten Runes Wizards Cult
////////////////////
const axios = require("axios");
let rank = {
  Head: 1,
  Body: 2,
  Familiar: 3,
  Prop: 4,
  Rune: 5,
  Background: 6,
  Affinity: 7,
  "% Traits in Affinity": 8,
  "# Traits in Affinity": 9,
  "# Traits": 10,
};

const api = async (req, res) => {
  const { id } = req.query;
  let contract = "0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42";
  let url = `https://bafybeifd5ctqsiszoveqqtran7tvyg4xpjxu67nthf5n6ugdazeox5n5fa.ipfs.infura-ipfs.io/${id}`;
  axios
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
          name: response.data.name,
          description: null,
          image: `https://bafybeigjl2wwcakyvqd4s6odmmyy3lqxiyffv3wk4su5p5bincksxgga2a.ipfs.infura-ipfs.io/${id}.png`,
          community: "forgottenrunes",
          collection: {
            id: "forgottenruneswizardscult",
            name: "Forgotten Runes Wizards Cult",
            description:
              "The Forgotten Runes Wizard's Cult is a collaborative legendarium. 10,000 unique Wizard NFTs, fully encoded on-chain.",
            image:
              "https://lh3.googleusercontent.com/rfEd3YcRfS8Hk8YcZjD20Vrqu8XTazvnzklVN9pUcROrwhoLO8RbP0yiBQuemgGPpWMgEDGU7qO164x42GRn60Xv6aeFbdZkttzBjx8=s120",
            royaltyBps: "250",
            royaltyRecipient: "0xd584fe736e5aad97c437c579e884d15b17a54a51",
            community: "forgottenrunes",
          },
          attributes: attributes,
        };
        res.status(200).json(meta);
      } else {
        res.status(200).json({ error: "Not found" });
      }
    })
    .catch((error) => {
      res.status(200).json({ error: "Unknown error" });
    });
};

export default api;
