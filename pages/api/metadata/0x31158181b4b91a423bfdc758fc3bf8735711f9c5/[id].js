////////////////////
// The Forgotten Runes Infinity Veil
////////////////////
const axios = require("axios");

const api = async (req, res) => {
  const { id } = req.query;
  let contract = "0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42";
  let url = `https://bafybeihrqbxp3yvr3frwqmllwbauxep3wbo4dl7gtlu7oe6psqmzer5ana.ipfs.infura-ipfs.io`;
  axios
    .get(url)
    .then((response) => {
      if (response.data) {
        let attributes = response.data.attributes.reduce((result, trait) => {
          result.push({
            key: trait.trait_type,
            value: trait.value,
            kind: isNaN(trait.value) ? "string" : "number",
          });
          return result;
        }, []);
        let meta = {
          name: response.data.name,
          description: null,
          image:
            "https://bafybeidvwhrv57u6l5qmno5b6n4yd3gg44zjgrehsej527ciuxqbyulvvi.ipfs.infura-ipfs.io/",
          community: "forgottenrunes",
          collection: {
            id: "infinityveil",
            name: "The Forgotten Runes Infinity Veil",
            description: "The Forgotten Runes Wizard's Cult Infinity Veil",
            image:
              "https://lh3.googleusercontent.com/7nV2lPNF1qYpeTGIh1K-yBX9ezG9ziX45pUHM_fhnNlGj_htRXILODtNHSbp0prFixct4ndPSugqI5D_gMxFYtSd_1BsIrKxBNRcjw",
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
