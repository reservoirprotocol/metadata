////////////////////
// Genesis Mana
////////////////////

const { BigNumber } = require("@ethersproject/bignumber");
const { id } = require("@ethersproject/hash");
import { request, gql } from "graphql-request";
import { itemRarity, rarityColor, rarityDescription, lootRarity } from "loot-rarity";

let items = [
  "Weapon", //1
  "Chest Armor", //2
  "Head Armor", //3
  "Waist Armor", //4
  "Foot Armor", //5
  "Hand Armor", //6
  "Neck Armor", //7
  "Ring", //8
];
let suffixes = [
  ["", ""], // 0
  ["Power", "#191D7E"], // 1
  ["Giants", "#DAC931"], // 2
  ["Titans", "#B45FBB"], // 3
  ["Skill", "#1FAD94"], // 4
  ["Perfection", "#2C1A72"], // 5
  ["Brilliance", "#36662A"], // 6
  ["Enlightenment", "#78365E"], // 7
  ["Protection", "#4F4B4B"], // 8
  ["Anger", "#9B1414"], // 9
  ["Rage", "#77CE58"], // 10
  ["Fury", "#C07A28"], // 11
  ["Vitriol", "#511D71"], // 12
  ["the Fox", "#949494"], // 13
  ["Detection", "#DB8F8B"], // 14
  ["Reflection", "#318C9F"], // 15
  ["the Twins", "#00AE3B"], // 16
];
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
  // let meta = await getMetadata(id)
  // console.log(meta)
  //https://api.thegraph.com/subgraphs/id/QmUFhiZjMsWK4tznnHFNn5utZpfQdCS9rWbqSFfgzTXFt2
  //request('https://api.thegraph.com/subgraphs/id/QmUFhiZjMsWK4tznnHFNn5utZpfQdCS9rWbqSFfgzTXFt2', gql`{
  return request(
    "https://api.thegraph.com/subgraphs/name/treppers/genesisproject",
    gql`{
    manas(where: {id: ${id}}) {
      id,
      OGMinterAddress,
      tokenURI,
      lootTokenId {
        id
      },
      itemName,
      suffixId {
        id
      },
      inventoryId
    }
  }`
  )
    .then((data) => {
      //res.status(200).json(data);
      if (data.manas && data.manas.length > 0) {
        let tokenURI = JSON.parse(
          Buffer.from(
            data.manas[0].tokenURI.split("data:application/json;base64,")[1],
            "base64"
          ).toString()
        );
        let meta = {
          token_id: id,
          name: `Genesis Mana #${id}`,
          description: "This item is Genesis Mana used in Loot (for Adventurers)",
          image: tokenURI.image,
          community: "none",
          collection: {
            id: "genesis-mana",
            name: "Genesis Mana",
            setId: `contract:0xf4b6040a4b1b30f1d1691699a8f3bf957b03e463`,
            description:
              "Genesis Mana is a Mint Pass for a Genesis Adventurer (for Loot). Upon collecting a perfect set of 8 Genesis Mana from a single Order, corresponding to all 8 item types (i.e. weapon, head armor, chest armor, etc), players can resurrect a Genesis Adventurer using the 2nd smart contract. Thus returned to defend its original Order, each Genesis Adventurer will entitle the owner to benefits and rewards, including unique access to claiim derivative projects, airdropped ERC20 tokens similar to $AGLD and more.",
            image:
              "https://lh3.googleusercontent.com/PBMCkL2BsftmHR3CnOO5DRHdBYpKcOjFZpymCDu-l2fVzffixhHU8S0qWrONuXWDMOdZn0QgsepGFjKwEqJO5aAk4LzlhTdM3Hdc=s130",
            royalty_amount: "250",
            royalty_recipient: "0x96f47d56f25d2ba629db1f55db0517dee67640e1",
            royaltyBps: "250",
            royaltyRecipient: "0x96f47d56f25d2ba629db1f55db0517dee67640e1",
            community: "none",
          },
          attributes: [],
        };
        meta.attributes.push({
          category: "Properties",
          key: `Item Name`,
          value: data.manas[0].itemName,
        });
        let itemType = items[data.manas[0].inventoryId];
        meta.attributes.push({
          category: "Properties",
          key: `Item Type`,
          value: itemType,
        });
        meta.attributes.push({
          category: "Properties",
          key: `Order`,
          value: suffixes[data.manas[0].suffixId.id][0],
        });
        if (data.manas[0].lootTokenId) {
          let bagId = data.manas[0].lootTokenId.id;
          meta.attributes.push({
            category: "Properties",
            key: `Loot Bag ID`,
            value: parseInt(bagId),
          });
          const rand = random(itemType.split(" ")[0].toUpperCase() + data.manas[0].lootTokenId.id);
          const greatness = rand.mod(21);
          meta.attributes.push({
            category: "Properties",
            key: `Greatness`,
            value: greatness.toNumber(),
          });
        }
        meta.attributes.push({
          category: "Properties",
          key: `Rarity`,
          value: rarityDescription(itemRarity(data.manas[0].itemName)),
        });

        // meta.attributes.push({
        //   "category": "Properties",
        //   "key": `Order Count`,
        //   "value": data.adventurers[0].orderCount
        // })
        // meta.attributes.push({
        //   "category": "Properties",
        //   "key": `Plus Ones`,
        //   "value": scores.plusones
        // })
        // meta.attributes.push({
        //   "category": "Properties",
        //   "key": `Names`,
        //   "value": scores.names
        // })
        console.log(meta);
        for (const attr of meta.attributes) {
          if (isNaN(attr.value)) {
            attr.kind = "string";
          } else {
            attr.kind = "number";
          }
        }
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
