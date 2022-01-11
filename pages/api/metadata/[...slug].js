const axios = require('axios')

export default function handler(req, res) {
    const { slug } = req.query
    let contract = slug[0]
    const tokenId = slug[1]
    let community = 'none'
    switch(contract.toLowerCase()) {
        case '0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63':
        case '0x448f3219cf2a23b0527a7a0158e7264b87f635db':
            community = 'blitmap'
            break;
        case '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d':
        case '0xba30e5f9bb24caa003e9f2f0497ad287fdf95623':
        case '0x60e4d786628fea6478f785a6d7e704777c86a7c6':
        case '0x22c36bfdcef207f9c0cc941936eff94d4246d14a':
            community = 'bayc'
            break;
        case '0x059edd72cd353df5106d2b9cc5ab83a52287ac3a':
        case '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270':
            community = 'artblocks'
            break;
        case '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb':
        case '0xb7f7f6c52f2e2fdb1963eab30438024864c313f6':
            community = 'cryptopunks'
            contract = '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb' // always return unwrapped metadata
            break;
        case '0x79986af15539de2db9a5086382daeda917a9cf0c':
            community = 'cryptovoxels'
            break;
    }
    const base = process.env.NEXT_PUBLIC_CHAIN_ID == 4
    ? 'https://rinkeby-api.opensea.io/api/v1/asset'
    : 'https://api.opensea.io/api/v1/asset';
    let url = `${base}/${contract}/${tokenId}`
    axios.get(url).then((response) => {
        if(response.data) {
            //console.log(response.data)
            let meta = {
                "name": response.data.name,
                "description": response.data.description, 
                "image": response.data.image_url,
                "community": community,
                "collection": {
                    "id":response.data.collection.slug,
                    "name": response.data.collection.name,
                    "description": response.data.collection.description,
                    "image": response.data.collection.image_url,
                    "royalty_amount": response.data.collection.dev_seller_fee_basis_points,
                    "royalty_recipient": response.data.collection.payout_address,
                    "royaltyBps": response.data.collection.dev_seller_fee_basis_points,
                    "royaltyRecipient": response.data.collection.payout_address,
                    "community": community,
                },
                "attributes":response.data.traits.map(trait => {
                    return {
                        "category":"Properties",
                        "key": trait.trait_type.trim(),
                        "value": isNaN(trait.value) ? trait.value.trim() : trait.value,
                        "kind": isNaN(trait.value) ? "string" : "number"
                    }
                })
              }
            res.status(200).json(meta);
        } else {
            res.status(200).json({error: "Not found"});
        }
    }).catch((error)=>{
        res.status(200).json({error: "Unknown error"});
    })
  }