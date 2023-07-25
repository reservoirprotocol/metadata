import axios from "axios";

export const fetchCollection = async (_chainId, { contract, instanceId }) => {
  const result = await axios
    .get(`https://apps.api.manifoldxyz.dev/public/instance/data?id=${instanceId}`)
    .then((response) => response.data);

  return {
    id: contract,
    slug: result.slug,
    name: result.publicData.name,
    metadata: {
      description: result.publicData.description ?? null,
      imageUrl: result.publicData.image ?? null,
    },
    contract,
    tokenSetId: `contract:${contract}`,
  };
};
