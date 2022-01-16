////////////////////
// ENS
////////////////////
const axios = require('axios')

const api = async (req, res) => {
  const { id } = req.query
  let contract = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85'
  let url = `https://metadata.ens.domains/mainnet/${contract}/${id}`
  axios.get(url).then((response) => {
    if(response.data) {
      if(!response.data.is_normalized) {
        res.status(200).json({});
        return
      }
      let attributes = response.data.attributes.reduce((result,trait) => {
        if(trait.trait_type!="Created Date") {
          result.push({
            "key": trait.trait_type,
            "value": trait.value,
            "kind": trait.trait_type=="Length" ? "range" : "date"
          })
        }
        return result
      },[])
      if(response.data.name.split(".").length>2) {
        res.status(200).json({});
        return
      }
      let meta = {
        "name": response.data.name,
        "description": response.data.description, 
        "image": response.data.image_url,
        "community": "ens",
        "collection": {
            "id": "ens",
            "setId":null,
            "name": "ENS: Ethereum Name Service",
            "description": "Ethereum Name Service (ENS) domains are secure domain names for the decentralized world. ENS domains provide a way for users to map human readable names to blockchain and non-blockchain resources, like Ethereum addresses, IPFS hashes, or website URLs. ENS domains can be bought and sold on secondary markets.",
            "image": "https://app.ens.domains/static/media/ensIconLogo.19559e18.svg",
            "royaltyBps": 0,
            "royaltyRecipient": null,
            "community": "ens",
        },
        "attributes":attributes
      }
      res.status(200).json(meta);
    } else {
      res.status(200).json({error: "Not found"});
    }
  }).catch((error)=>{
    res.status(200).json({error: "Unknown error"});
  })
};

export default api;