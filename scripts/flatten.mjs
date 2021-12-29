import * as DCC from './update_dcc.mjs'
import * as VCI from './update_vci.mjs'

import fs from 'fs';

let registry = JSON.parse(fs.readFileSync("registry_normalized.json"));

let csv = []
Object.entries(registry).forEach(([framework,v]) => {
  Object.entries(registry[framework]).forEach(([kid,v]) => {
    csv.push([
      framework,
      kid,
      v.entityType,
      v.status,
      v.displayName.en ? Buffer.from(v.displayName.en).toString('base64') : "",
      v.displayLogo ? Buffer.from(v.displayLogo).toString('base64') : "",
      v.validFromDT,
      v.validUntilDT,
      v.publicKey
    ].join(","));
  }); 
}); 

fs.writeFile('registry.csv', csv.join("\n"), function writeCSV(err) {
  if (err) return console.log(err);
});
