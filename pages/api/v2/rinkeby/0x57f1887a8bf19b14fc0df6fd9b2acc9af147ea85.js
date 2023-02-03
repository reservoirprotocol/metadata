////////////////////
// ENS
////////////////////
const axios = require("axios");

const api = async (req, res) => {
  const { id } = req.query;
  // Batch
  if (req.query.token_ids) {
    let ids = Array.isArray(req.query.token_ids) ? req.query.token_ids : [req.query.token_ids];
    let data = await getBatch(ids);
    res.status(200).json(data);
  }
  // Single
  else {
    res.status(200).json(await getToken(id));
  }
};

async function getBatch(ids) {
  let promises = ids.map((id) => getToken(id));
  return Promise.all(promises).then((data) => {
    return data;
  });
}

async function getToken(id) {
  let contract = "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85";
  let url = `https://metadata.ens.domains/rinkeby/${contract}/${id}?t=${Date.now()}`;
  console.log("getting", url);
  return axios
    .get(url)
    .then((response) => {
      console.log("got", url);
      if (response.data) {
        if (!response.data.is_normalized) {
          return { token_id: id, skip: true };
        }
        let attributes = response.data.attributes.reduce((result, trait) => {
          if (trait.trait_type != "Created Date") {
            result.push({
              key: trait.trait_type,
              value: trait.value,
              kind: trait.trait_type == "Length" ? "range" : "date",
            });
          }
          return result;
        }, []);
        if (response.data.name.split(".").length > 2) {
          return { token_id: id, skip: true };
        }
        let meta = {
          token_id: id,
          name: response.data.name,
          description: response.data.description,
          image: response.data.image_url,
          community: "ens",
          collection: {
            id: "ens",
            setId: null,
            name: "ENS: Ethereum Name Service",
            description:
              "Ethereum Name Service (ENS) domains are secure domain names for the decentralized world. ENS domains provide a way for users to map human readable names to blockchain and non-blockchain resources, like Ethereum addresses, IPFS hashes, or website URLs. ENS domains can be bought and sold on secondary markets.",
            image: "https://app.ens.domains/static/media/ensIconLogo.19559e18.svg",
            royaltyBps: 0,
            royaltyRecipient: null,
            community: "ens",
          },
          attributes: attributes,
        };
        return meta;
      } else {
        return { token_id: id, skip: false };
      }
    })
    .catch((error) => {
      console.log(error.message);
      return { token_id: id, skip: false };
    });
}

export default api;
