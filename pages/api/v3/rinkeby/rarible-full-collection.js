import axios from "axios";

import * as loot from "./custom/0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78";

const getAllTokensMetadata = async (collection) => {
  let pageSize = 1000;
  let done = false;
  let continuation = "";

  const items = [];
  while (!done) {
    const searchParams = new URLSearchParams();
    searchParams.append("collection", collection);
    searchParams.append("size", pageSize);
    searchParams.append("continuation", continuation);

    const url = `https://ethereum-api-staging.rarible.org/v0.1/nft/items/byCollection?${searchParams.toString()}`;
    const data = await axios.get(url).then((response) => response.data);

    if (!data.continuation || data.total < pageSize) {
      done = true;
    }

    if (data.items && data.items.length > 0) {
      try {
        for (const item of data.items) {
          // Image
          let imageUrl = null;
          try {
            imageUrl = item.meta.image.url[Object.keys(item.meta.image.meta)[0]];
            if (!imageUrl) {
              imageUrl = item.meta.image.url["ORIGINAL"];
            }
          } catch (error) {
            // Skip any errors
          }

          // Attributes
          const attributes = item.meta.attributes.reduce((result, trait) => {
            if (trait.value) {
              result.push({
                key: trait.key,
                value: trait.value,
                kind: isNaN(trait.value) ? "string" : "number",
                rank: 1,
              });
            }
            return result;
          }, []);

          // Token descriptions are a waste of space for most collections we deal with
          // so by default we ignore them (this behaviour can be overridden if needed).
          items.push({
            contract: item.contract,
            tokenId: item.tokenId,
            name: item.meta.name,
            imageUrl: imageUrl,
            attributes,
          });
        }
      } catch (error) {
        // Skip any errors
      }
    }
    continuation = data.continuation;
  }

  return items;
};

const api = async (req, res) => {
  try {
    const collection = req.query.collection?.toLowerCase();
    if (!collection) {
      throw new Error("Missing collection");
    }

    let metadata;
    switch (collection) {
      case "0x79e2d470f950f2cf78eef41720e8ff2cf4b3cd78": {
        metadata = loot.getAllTokensMetadata();
        break;
      }

      default: {
        metadata = await getAllTokensMetadata(collection);
        break;
      }
    }

    return res.status(200).json({ metadata });
  } catch (error) {
    return res.status(500).json({ error: `Internal error: ${error}` });
  }
};

export default api;
