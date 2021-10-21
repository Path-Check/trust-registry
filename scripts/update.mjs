import * as DCC from './update_dcc.mjs'
import * as VCI from './update_vci.mjs'

import fs from 'fs';

let registry = JSON.parse(fs.readFileSync("registry.json"));

registry = await DCC.update(registry);
registry = await VCI.update(registry);

/*
let registry2 = {
  "CRED": registry["CRED"],
  "ICAO": registry["ICAO"], 
  "DIVOC": registry["DIVOC"],
  "EUDCC": registry["EUDCC"]
};

const standard = "SmartHealthCards";

registry2[standard] = {};
for (const issuer of Object.keys(registry[standard])) {
  let entry = registry[standard][issuer];
  for (const key of entry.didDocument.jwks.keys) {
    

    let newEntry = {
      "displayName": entry.displayName,
      "entityType":  entry.entityType,
      "status":  entry.status,
      "validFromDT":  entry.validFromDT,
      "didDocument": key,
      "credentialType": entry.credentialType
    };

    if (!registry2[standard][issuer+"#"+key.kid])
      registry2[standard][issuer+"#"+key.kid] = newEntry;
    else 
      console.log(key.kid, "already exists");
  }
}

fs.writeFile('registry.json', JSON.stringify(registry2, null, 2), function writeJSON(err) {
  if (err) return console.log(err);
});
*/