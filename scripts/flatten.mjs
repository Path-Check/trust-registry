import * as DCC from './update_dcc.mjs'
import * as VCI from './update_vci.mjs'

import fs from 'fs';

let registry = JSON.parse(fs.readFileSync("registry_normalized.json"));

let csv = []
for (let framework in registry) {
  for (let kid in registry[framework]) {
    let v = registry[framework][kid]
    if (v.publicKey) {
      csv.push([
        framework,
        kid,
        v.status,
        v.displayName.en ? Buffer.from(v.displayName.en).toString('base64') : "",
        v.displayLogo ? Buffer.from(v.displayLogo).toString('base64') : "",
        v.validFromDT,
        v.validUntilDT,
        v.publicKey,
        v.displayURL ? Buffer.from(v.displayURL).toString('base64') : "",
      ].join(","));
    }
  } 
} 

fs.writeFile('registry_normalized.csv', csv.join("\n"), function writeCSV(err) {
  if (err) return console.log(err);
});
