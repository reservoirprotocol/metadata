const axios = require("axios");
const Yaml = require("yamljs");

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const url = `https://indexer-v3-api-production.up.railway.app/swagger.json`;
  axios
    .get(url)
    .then((response) => {
      if (response) {
        const swaggerJson = response.data;
        const yaml = Yaml.dump(swaggerJson, 10, 2);
        res.status(200).json(yaml);
      } else {
        res.status(200).json({ error: "Not found" });
      }
    })
    .catch(() => {
      res.status(200).json({ error: "Unknown error" });
    });
}
