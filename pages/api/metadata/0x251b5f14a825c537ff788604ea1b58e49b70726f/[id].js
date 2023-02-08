////////////////////
// Forgotten Souls
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
  Undesirable: 8,
};

const api = async (req, res) => {
  const { id } = req.query;
  let contract = "0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42";
  let url = `https://portal.forgottenrunes.com/api/souls/data/${id}`;
  axios
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
          name: response.data.name,
          description: null,
          image: response.data.image,
          community: "forgottenrunes",
          collection: {
            id: "forgottensouls",
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
        res.status(200).json(meta);
      } else {
        res.status(200).json({ error: "Not found" });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(200).json({ error: "Unknown error" });
    });
};

export default api;
