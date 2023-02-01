////////////////////
// Forgotten Runes Ponies
////////////////////
const axios = require("axios");

const api = async (req, res) => {
  const { id } = req.query;
  let contract = "0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42";
  let url = `https://portal.forgottenrunes.com/api/shadowfax/data/${id}`;
  axios
    .get(url)
    .then((response) => {
      if (response.data) {
        let attributes = response.data.attributes.reduce((result, trait) => {
          let trait_type = trait.trait_type.charAt(0).toUpperCase() + trait.trait_type.slice(1);
          result.push({
            key: trait_type,
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
            id: "forgottenrunesponies",
            name: "Forgotten Runes Ponies",
            description:
              "On a crisp December 24th, 2021 snow fell on the secret tower, a rumble in the distance. Then a whinny. From the Elysian Fields, a herd of 567 ponies appeared in the Forgotten Runiverse. The minting was free (+gas) for anyone who received a merch box or held a Wizard (or Soul) that had Lore (details below).",
            image:
              "https://lh3.googleusercontent.com/3TPhA6JRPww4xSe6EwDTS8rj1VyQVLOOFH__C_ckJSd63zBx4WJx3U1deEtCVgaWJBmC5aTdDGneFAa4y7SpM86pJFBHOD4rdNG8",
            royaltyBps: "444",
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
