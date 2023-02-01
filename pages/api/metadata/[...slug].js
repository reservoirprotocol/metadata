const axios = require("axios");

async function getTokens(url) {
  return axios
    .get(url, {
      headers: { "X-API-KEY": String(process.env.OPENSEA_API_KEY).trim() },
    })
    .then((response) => {
      if (!response.data) {
        return { error: "Not found" };
      } else {
        return response.data;
      }
    })
    .catch((error) => {
      return {
        error:
          "Unknown error. Missing OPENSEA_API_KEY? " +
          String(process.env.OPENSEA_API_KEY) +
          " " +
          url +
          " " +
          String(error.message) +
          " " +
          String(error.stack) +
          " " +
          JSON.stringify(error, Object.getOwnPropertyNames(error)),
      };
    });
}

export default async function handler(req, res) {
  const { slug } = req.query;
  let contract = slug[0];
  const tokenId = slug[1];
  let community = "none";
  switch (contract.toLowerCase()) {
    case "0x8d04a8c79ceb0889bdd12acdf3fa9d207ed3ff63":
    case "0x448f3219cf2a23b0527a7a0158e7264b87f635db":
      community = "blitmap";
      break;
    case "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d":
    case "0xba30e5f9bb24caa003e9f2f0497ad287fdf95623":
    case "0x60e4d786628fea6478f785a6d7e704777c86a7c6":
    case "0x22c36bfdcef207f9c0cc941936eff94d4246d14a":
      community = "bayc";
      break;
    case "0x059edd72cd353df5106d2b9cc5ab83a52287ac3a":
    case "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270":
      community = "artblocks";
      break;
    case "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb":
    case "0xb7f7f6c52f2e2fdb1963eab30438024864c313f6":
      community = "cryptopunks";
      contract = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb"; // always return unwrapped metadata
      break;
    case "0x79986af15539de2db9a5086382daeda917a9cf0c":
      community = "cryptovoxels";
      break;
  }
  const base =
    process.env.NEXT_PUBLIC_CHAIN_ID == 4
      ? "https://rinkeby-api.opensea.io/api/v1/assets"
      : "https://api.opensea.io/api/v1/assets";
  let url = `${base}?asset_contract_address=${contract}`;
  // Batch
  if (req.query.token_ids) {
    let ids = Array.isArray(req.query.token_ids) ? req.query.token_ids : [req.query.token_ids];
    for (let token of ids) {
      url += `&token_ids=${token}`;
    }
  }
  // Single
  else {
    url += `&token_ids=${tokenId}`;
  }
  let data = await getTokens(url);
  if (data.error) {
    res.status(200).json(data);
  }

  let tokens = [];
  for (let asset of data.assets) {
    //console.log(asset)
    tokens.push({
      token_id: asset.token_id,
      name: asset.name,
      description: asset.description,
      image: asset.image_url,
      community: community,
      collection: {
        id: asset.collection.slug,
        name: asset.collection.name,
        description: asset.collection.description,
        image: asset.collection.image_url,
        royaltyBps: asset.collection.dev_seller_fee_basis_points,
        royaltyRecipient: asset.collection.payout_address,
        community: community,
      },
      attributes: asset.traits.map((trait) => {
        return {
          key: trait.trait_type,
          value: trait.value,
          kind: isNaN(trait.value) ? "string" : "number",
        };
      }),
    });
  }
  // Batch
  if (req.query.token_ids) {
    res.status(200).json(tokens);
  }
  // Single
  else {
    res.status(200).json(tokens[0]);
  }
}
