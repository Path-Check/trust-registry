import * as DCC from './update_dcc.mjs'
import * as VCI from './update_vci.mjs'

import fs from 'fs';

function flatten(registry_file, out_file) {
  let registry = JSON.parse(fs.readFileSync(registry_file));

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

  fs.writeFile(out_file, csv.join("\n"), function writeCSV(err) {
    if (err) return console.log(err);
  });
}

flatten("registry_normalized.json", "registry_normalized.csv");
flatten("test_registry_normalized.json", "test_registry_normalized.csv");