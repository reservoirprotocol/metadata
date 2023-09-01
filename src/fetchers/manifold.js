import axios from "axios";
import { normalizeMetadata } from "../shared/utils";

export const fetchCollection = async (_chainId, { contract, instanceId }) => {
  const result = await axios
    .get(`https://apps.api.manifoldxyz.dev/public/instance/data?id=${instanceId}`)
    .then((response) => response.data);

  return {
    id: contract,
    slug: result.slug,
    name: result.publicData.name,
    metadata: normalizeMetadata(result.publicData),
    contract,
    tokenSetId: `contract:${contract}`,
  };
};
