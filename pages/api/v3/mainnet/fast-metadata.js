import axios from "axios";

const getAllTokensMetadata = async (collection) => {
  let pageSize = 1000;
  let done = false;
  let continuation = "";

  const items = [];
  while (!done) {
    let url = "https://ethereum-api.rarible.org/v0.1/nft/items/byCollection";
    url += `?collection=${collection}`;
    url += `&size=${pageSize}`;
    url += `&continuation=${continuation}`;

    const data = await axios.get(url).then((response) => response.data);
    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.continuation || data.total < pageSize) {
      done = true;
    }

    if (data.items && data.items.length > 0) {
      try {
        for (const item of data.items) {
          // Image
          let imageUrl = null;
          try {
            imageUrl =
              item.meta.image.url[Object.keys(item.meta.image.meta)[0]];
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

    // For now, fast metadata is not supported for ArtBlocks
    // (or any other non-contract collections)
    const artblocksAddresses = [
      // Old ArtBlocks contract
      "0x059edd72cd353df5106d2b9cc5ab83a52287ac3a",
      // New ArtBlocks contract
      "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    ];
    if (artblocksAddresses.includes(collection)) {
      throw new Error("Unsupported collection");
    }

    let metadata;
    switch (collection) {
      case "0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7": {
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
