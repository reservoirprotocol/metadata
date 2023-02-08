////////////////////
// The Forgotten Runes Infinity Veil
////////////////////

const axios = require("axios");

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
  let url = `https://bafybeihrqbxp3yvr3frwqmllwbauxep3wbo4dl7gtlu7oe6psqmzer5ana.ipfs.infura-ipfs.io`;
  if (id != 0) {
    return { token_id: id, skip: true };
  }
  return axios
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
          token_id: id,
          name: response.data.name,
          description: null,
          image:
            "https://bafybeidvwhrv57u6l5qmno5b6n4yd3gg44zjgrehsej527ciuxqbyulvvi.ipfs.infura-ipfs.io/",
          community: "forgottenrunes",
          collection: {
            id: "infinityveil",
            setId: `contract:0x31158181b4b91a423bfdc758fc3bf8735711f9c5`,
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
