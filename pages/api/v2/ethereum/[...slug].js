const axios = require("axios");

export default async function handler(req, res) {
  const { slug } = req.query;
  let contract = slug[0];
  const tokenId = slug[1];
  let community = getCommunity(contract);
  if (req.query.token_ids) {
    return res.status(200).json(await getTokens(req.query.token_ids, contract, community, false));
  } else if (req.query.all) {
    // Get tokens from Rarible
    let tokens = await getCollectionTokens(contract, community);
    if (!Array.isArray(tokens)) {
      return res.status(200).json(tokens);
    }

    // Get collection metadata from Open Sea
    let collection = await getCollection(contract, community);
    if (collection.error) {
      return res.status(200).json(collection);
    }

    // Combine
    return res.status(200).json({ collection, tokens });
  } else if (tokenId) {
    return res.status(200).json(await getTokens(tokenId, contract, community, true));
  } else {
    return res.status(200).json({ error: "Unrecognized request" });
  }
}

async function getCollection(contract, community) {
  let url = `https://api.opensea.io/api/v1/assets?asset_contract_address=${contract}&limit=1`;
  let data = await getOpenSea(url);
  if (data.error) {
    return data;
  }
  let asset = data.assets[0];
  return {
    id: asset.collection.slug,
    setId: `contract:${contract}`,
    name: asset.collection.name,
    description: asset.collection.description,
    image: asset.collection.image_url,
    royaltyBps: asset.collection.dev_seller_fee_basis_points,
    royaltyRecipient: asset.collection.payout_address,
    community: community,
  };
}

async function getCollectionTokens(contract, community) {
  let pageSize = 1000,
    done = false,
    continuation = "",
    items = [];
  while (!done) {
    let url = `https://ethereum-api.rarible.org/v0.1/nft/items/byCollection?collection=${contract}&size=${pageSize}&continuation=${continuation}`;
    let data = await getRarible(url);
    if (data.error) {
      return data;
    }
    if (!data.continuation || data.total < pageSize) {
      done = true;
    }
    if (data.items && data.items.length > 0) {
      for (let item of data.items) {
        // Parse Image
        let imageURL = null;
        try {
          imageURL = item.meta.image.url[Object.keys(item.meta.image.meta)[0]];
        } catch (e) {}
        // Parse Attributes
        let attributes = item.meta.attributes.reduce((result, trait) => {
          if (trait.value) {
            result.push({
              key: trait.key,
              value: trait.value,
              kind: isNaN(trait.value) ? "string" : "number",
            });
          }
          return result;
        }, []);
        items.push({
          token_id: item.tokenId,
          name: item.meta.name,
          description: "", //token descriptions are waste of space for most collections we deal with...
          image: imageURL,
          community: community,
          attributes,
        });
      }
    }
    continuation = data.continuation;
    //done=true // for testing
  }
  return items;
}

async function getTokens(token_ids, contract, community, isSingle) {
  const base = "https://api.opensea.io/api/v1/assets";
  let url = `${base}?asset_contract_address=${contract}`;
  let ids = Array.isArray(token_ids) ? token_ids : [token_ids];
  for (let token of ids) {
    url += `&token_ids=${token}`;
  }
  let data = await getOpenSea(url);
  if (data.error) {
    return data;
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
        setId: ["artblocks"].includes(community) ? null : `contract:${contract}`,
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
  if (isSingle) {
    return tokens[0];
  } else {
    return tokens;
  }
}

async function getOpenSea(url) {
  return axios
    .get(url, {
      headers: {
        "X-API-KEY": process.env.OPENSEA_API_KEY.trim(),
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1",
      },
    })
    .then((response) => {
      if (!response.data) {
        return { error: "Not found" };
      } else {
        return response.data;
      }
    })
    .catch((error) => {
      return { error, url };
    });
}

async function getRarible(url) {
  return axios
    .get(url)
    .then((response) => {
      if (!response.data) {
        return { error: "Not found" };
      } else {
        return response.data;
      }
    })
    .catch((error) => {
      return { error, url };
    });
}

function getCommunity(contract) {
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
  return community;
}
