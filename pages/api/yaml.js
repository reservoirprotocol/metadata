const Yaml = require('yamljs');
const axios = require('axios')

export default function handler(req, res) {

    let url = `https://indexer-v3-api-production.up.railway.app/swagger.json`
    axios.get(url).then((response) => {
        if(response) {
            let swaggerJson = response.data;
            const yaml = Yaml.dump(swaggerJson, 10, 2);
            console.log(yaml)
            res.status(200).json(yaml);
        } else {
            res.status(200).json({error: "Not found"});
        }
    }).catch((error)=>{
        res.status(200).json({error: "Unknown error"});
    })
}