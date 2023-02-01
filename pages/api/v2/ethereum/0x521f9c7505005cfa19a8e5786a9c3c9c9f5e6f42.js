////////////////////
// Forgotten Runes Wizards Cult
////////////////////
import wizards from "../../../../data/wizards.json";
let rank = {
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

function getToken(id) {
  try {
    let attributes = [];

    for (var trait of Object.keys(wizards[id])) {
      let kind = "string";
      let value = "";

      if (trait == "% Traits in Affinity") {
        value = wizards[id][trait].slice(0, -1);
      } else {
        value = wizards[id][trait];
      }

      if (trait.indexOf("Traits") !== -1) {
        kind = "number";
      }

      if (trait != "FullName") {
        attributes.push({
          key: trait,
          rank: rank[trait],
          value: value,
          kind,
        });
      }
    }

    let meta = {
      token_id: id,
      name: wizards[id]["FullName"],
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
  } catch (error) {
    console.log(error);
    return { token_id: id, skip: false };
  }
}

export default api;
