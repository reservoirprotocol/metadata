////////////////////
// Forgotten Souls
////////////////////

const axios = require("axios");
let rank = {
  Head: 9,
  Body: 8,
  Familiar: 7,
  Prop: 6,
  Rune: 5,
  Background: 4,
  Affinity: 3,
  Undesirable: 2,
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
  let url = `https://portal.forgottenrunes.com/api/souls/data/${id}`;
  return axios
    .get(url)
    .then((response) => {
      if (response.data) {
        let attributes = response.data.attributes.reduce((result, trait) => {
          let trait_type = trait.trait_type.charAt(0).toUpperCase() + trait.trait_type.slice(1);
          result.push({
            key: trait_type,
            rank: rank[trait_type] ? rank[trait_type] : -1,
            value: trait.value,
            kind: isNaN(trait.value) ? "string" : "number",
          });
          return result;
        }, []);
        let meta = {
          token_id: id,
          name: response.data.name,
          description: null,
          image: response.data.image,
          community: "forgottenrunes",
          collection: {
            id: "forgottensouls",
            setId: `contract:0x251b5f14a825c537ff788604ea1b58e49b70726f`,
            name: "Forgotten Souls",
            description:
              "The Forgotten Souls are the transmuted Souls of the Forgotten Runes Wizard's Cult. Each is created by burning both a Wizard and a Sacred Flame. No more than 1112 Forgotten Souls will ever exist.",
            image:
              "https://lh3.googleusercontent.com/YmqENqCWQEmEez-F6bj3b0rLa6nTyUEuB1OXdmxX5bGIg69LLKIucfkTZeOjkMMv0_eSPsCgr_vUqIPpXldSdZm5ZZSVI508ld32YWI",
            royaltyBps: "666",
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
