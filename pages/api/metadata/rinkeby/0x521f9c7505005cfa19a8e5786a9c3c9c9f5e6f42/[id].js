////////////////////
// ENS
////////////////////
const axios = require('axios')

const api = async (req, res) => {
  const { id } = req.query
  let contract = '0x521f9c7505005cfa19a8e5786a9c3c9c9f5e6f42'
  let url = `https://bafybeifd5ctqsiszoveqqtran7tvyg4xpjxu67nthf5n6ugdazeox5n5fa.ipfs.infura-ipfs.io/${id}`
  axios.get(url).then((response) => {
    if(response.data) {
      let attributes = response.data.attributes.reduce((result,trait) => {
          result.push({
            "key": trait.trait_type,
            "value": trait.value,
            "kind": trait.trait_type=="Serial" ? "range" : "string"
          })
        return result
      },[])
      let meta = {
        "name": response.data.name,
        "description": null, 
        "image": `https://bafybeigjl2wwcakyvqd4s6odmmyy3lqxiyffv3wk4su5p5bincksxgga2a.ipfs.infura-ipfs.io/${id}.png`,
        "community": "forgottenruneswizardscult",
        "collection": {
            "id": "forgottenruneswizardscult",
            "name": "Forgotten Runes Wizards Cult",
            "description": "The Forgotten Runes Wizard's Cult is a collaborative legendarium. 10,000 unique Wizard NFTs, fully encoded on-chain.",
            "image": "https://app.ens.domains/static/media/ensIconLogo.19559e18.svg",
            "image": "https://lh3.googleusercontent.com/rfEd3YcRfS8Hk8YcZjD20Vrqu8XTazvnzklVN9pUcROrwhoLO8RbP0yiBQuemgGPpWMgEDGU7qO164x42GRn60Xv6aeFbdZkttzBjx8=s120",
            "royaltyBps": "250",
            "royaltyRecipient": "0xd584fe736e5aad97c437c579e884d15b17a54a51",
            "community": "forgottenruneswizardscult",
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