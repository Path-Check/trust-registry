import { Certificate, PublicKey } from '@fidm/x509'
import jwkToPem from 'jwk-to-pem'

import fs from 'fs';

let registry = JSON.parse(fs.readFileSync("registry.json"));

let today = new Date();

for (let framework in registry) {
  for (let kid in registry[framework]) {
    let v = registry[framework][kid]
    
    try {
      if (typeof (v.didDocument) === "string") {
        if (v.didDocument.includes("CERTIFICATE")) {
          let cert = Certificate.fromPEM(v.didDocument)
          if (v['validFromDT'] !== cert.validFrom.toISOString()) {
            console.log(kid + " - Cert's validFrom (" + cert.validFrom.toISOString() + ") is different from in the validFrom in the json (" + v['validFromDT']+")");
            v['validFromDT'] = cert.validFrom.toISOString()
          };
          if (v['validUntilDT'] !== cert.validTo.toISOString()) {
            console.log(kid + " - Cert's validTo (" + cert.validTo.toISOString() + ") is different from in the validUntil in the json (" + v['validUntilDT']+")");
            v['validUntilDT'] = cert.validTo.toISOString()
          };

          // marks certificates as expired
          if (v['validFromDT'] && today < Date.parse(v['validFromDT']) && v['status'] == 'current') {
            console.log(kid + " should be marked as not started");
            //v['status'] = 'expired'
          }

          // marks certificates as expired
          if (v['validUntilDT'] && today > Date.parse(v['validUntilDT']) && v['status'] == 'current') {
            console.log(kid + " should be marked as expired");
            v['status'] = 'expired'
          }
        }
      } 
    } catch(e) {
      console.log(v.didDocument)
      console.log(e)
    }
  } 
} 

fs.writeFile('registry.json', JSON.stringify(registry, null, 2), function writeJSON(err) {
  if (err) return console.log(err);
});

