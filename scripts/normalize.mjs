import { Certificate, PublicKey } from '@fidm/x509'
import jwkToPem from 'jwk-to-pem'

import fs from 'fs';

function normalize(registry_file, out_file) {
  let registry_source = JSON.parse(fs.readFileSync(registry_file));

  let registry = {} 
  // Rename frameworks 
  registry["CRED"] = registry_source["CRED"] 
  registry["ICAO"] = registry_source["ICAO"] 
  registry["DIVOC"] = registry_source["DIVOC"] 
  registry["DCC"] = registry_source["EUDCC"] 
  registry["SHC"] = registry_source["SmartHealthCards"] 

  function cleanPEM(pem) {
    return pem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").replace(/\n/g, "").replace(/\r/g, "")
  }

  for (let framework in registry) {
    for (let kid in registry[framework]) {
      let v = registry[framework][kid]
      
      try {
        if (typeof (v.didDocument) === "string") {
          if (v.didDocument.includes("CERTIFICATE"))
            v['publicKey'] = cleanPEM(Certificate.fromPEM(v.didDocument).publicKey.toPEM())
          else if (v.didDocument.includes("PUBLIC KEY"))
            v['publicKey'] = cleanPEM(v.didDocument)
          else
            console.log("Something is wrong with:" + kid) 
        } else {  
          v['publicKey'] = cleanPEM(jwkToPem(v.didDocument));
        }
      } catch(e) {
        console.log(v.didDocument)
        console.log(e)
      }
      
      delete v.didDocument
    } 
  } 

  fs.writeFile(out_file, JSON.stringify(registry, null, 2), function writeJSON(err) {
    if (err) return console.log(err);
  });
}

normalize("registry.json", "registry_normalized.json");
normalize("test_registry.json", "test_registry_normalized.json");