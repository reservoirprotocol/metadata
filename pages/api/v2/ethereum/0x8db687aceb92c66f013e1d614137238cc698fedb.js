////////////////////
// Genesis Adventurer
////////////////////

// TODO: should make a single query to the graph instead of multiple

const { BigNumber } = require("@ethersproject/bignumber");
const { id } = require("@ethersproject/hash");
import { request, gql } from "graphql-request";

let items = ["weapon", "chest", "head", "waist", "foot", "hand", "neck", "ring"];
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
}
const random = (input) => BigNumber.from(id(input));

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
  return request(
    "https://api.thegraph.com/subgraphs/name/treppers/genesisproject",
    gql`{
    adventurers(where: {id: "${id}"}) {
      id,
      chest,
      foot,
      hand,
      head,
      neck,
      ring,
      waist,
      weapon,
      chestGM { lootTokenId { id } },
      footGM { lootTokenId { id } },
      handGM { lootTokenId { id } },
      headGM { lootTokenId { id } },
      neckGM { lootTokenId { id } },
      ringGM { lootTokenId { id } },
      waistGM { lootTokenId { id } },
      weaponGM { lootTokenId { id } },
      order,
      orderCount,
      tokenURI
    }
  }`
  )
    .then((data) => {
      console.log(data);
      //res.status(200).json(data);
      if (data.adventurers && data.adventurers.length > 0) {
        let tokenURI = JSON.parse(
          Buffer.from(
            data.adventurers[0].tokenURI.split("data:application/json;base64,")[1],
            "base64"
          ).toString()
        );
        let meta = {
          token_id: id,
          name: `Genesis Adventurer #${id}`,
          description: "This item is a Genesis Adventurer used in Loot (for Adventurers)",
          image: tokenURI.image,
          community: "loot",
          collection: {
            id: "genesisadventurer",
            setId: `contract:0x8db687aceb92c66f013e1d614137238cc698fedb`,
            name: "Genesis Adventurers",
            description:
              'You’ve collected a complete set of Genesis Loot ("Genesis Mana"), one for each item type, all of the same Order. You carry this precious Genesis Loot on your back, and climb to the top of the mountain to attempt to resurrect a Genesis Adventurer. You throw the bag in the fire — a Genesis Adventurer emerges from the flames. Thus returned to defend its original Order, each Genesis Adventurer will entitle the owner to benefits and rewards, including unique access to claim derivative projects, airdropped ERC20 tokens similar to $AGLD and more.',
            image:
              "https://lh3.googleusercontent.com/46LiRFAvwemkfLlRZIp4WbK21gWUWzFKIhes-FRfjAKdQeXbEue2cICtiQjZ_hT8GXgf28TfxyVYu5098vcpW9-KHsB9cZSuwVci=s130",
            royalty_amount: "250",
            royalty_recipient: "0x96f47d56f25d2ba629db1f55db0517dee67640e1",
            royaltyBps: "250",
            royaltyRecipient: "0x96f47d56f25d2ba629db1f55db0517dee67640e1",
            community: "loot",
          },
          attributes: [],
        };
        let scores = {
          names: 0,
          plusones: 0,
          greatness: 0,
          divines: 0,
          demons: 0,
          dragons: 0,
        };
        for (let item of items) {
          meta.attributes.push({
            category: "Items",
            key: `${capitalize(item)}`,
            value: data.adventurers[0][item],
          });
          if (data.adventurers[0][item].slice(-2) == "+1") {
            scores.plusones++;
          }
          if (data.adventurers[0][item].slice(0, 1) == '"') {
            scores.names++;
          }
          if (data.adventurers[0][`${item}GM`].lootTokenId) {
            let originId = data.adventurers[0][`${item}GM`].lootTokenId.id;
            meta.attributes.push({
              category: "Origin Bags",
              key: `${capitalize(item)} Origin Bag`,
              value: parseInt(originId),
            });
            console.log(data.adventurers[0][`${item}GM`].lootTokenId);
            let rand = random(item.toUpperCase() + originId);
            scores.greatness += rand.mod(21).toNumber();
          }
          if (data.adventurers[0][item].toLowerCase().search("dragon") >= 0) {
            scores.dragons++;
          }
          if (data.adventurers[0][item].toLowerCase().search("demon") >= 0) {
            scores.demons++;
          }
          if (data.adventurers[0][item].toLowerCase().search("divine") >= 0) {
            scores.divines++;
          }
        }
        meta.attributes.push({
          category: "Properties",
          key: `Order`,
          value: data.adventurers[0].order,
        });
        meta.attributes.push({
          category: "Properties",
          key: `Order Count`,
          value: data.adventurers[0].orderCount,
        });
        meta.attributes.push({
          category: "Properties",
          key: `Plus Ones`,
          value: scores.plusones,
        });
        meta.attributes.push({
          category: "Properties",
          key: `Names`,
          value: scores.names,
        });
        meta.attributes.push({
          category: "Properties",
          key: `Greatness`,
          value: scores.greatness,
        });
        meta.attributes.push({
          category: "Properties",
          key: `Dragons`,
          value: scores.dragons,
        });
        meta.attributes.push({
          category: "Properties",
          key: `Demons`,
          value: scores.demons,
        });
        meta.attributes.push({
          category: "Properties",
          key: `Divines`,
          value: scores.divines,
        });
        for (const attr of meta.attributes) {
          if (isNaN(attr.value)) {
            attr.kind = "string";
          } else {
            attr.kind = "number";
          }
        }
        //console.log(meta)
        return meta;
      } else {
        return { token_id: id, skip: false };
      }
    })
    .catch((e) => {
      console.log(e);
      return { token_id: id, skip: false };
    });
}

export default api;
