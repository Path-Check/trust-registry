import { Certificate, PublicKey } from '@fidm/x509'
import jwkToPem from 'jwk-to-pem'

import { createPrivateKey, createPublicKey } from "crypto"

import fs from 'fs';

async function normalize(registry_file, out_file, isPEM) {
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

  function didToPEM(didDocument) {
    if (typeof (didDocument) === "string") {
      if (didDocument.includes("CERTIFICATE"))
        return cleanPEM(Certificate.fromPEM(didDocument).publicKey.toPEM())
      else if (didDocument.includes("PUBLIC KEY"))
        return cleanPEM(didDocument)
      else
        console.log("Something is wrong with:" + kid) 
        return "";
    } else {  
      return cleanPEM(jwkToPem(didDocument));
    }
  }

  async function didToJWK(didDocument) {
    if (typeof (didDocument) === "string") {
      if (didDocument.includes("CERTIFICATE")) {
        return createPublicKey(didDocument).export({format: 'jwk'});
      } else if (didDocument.includes("PUBLIC KEY")) {
        return createPublicKey(didDocument).export({format: 'jwk'});
      } else
        console.log("Something is wrong with:" + kid) 
        return "";
    } else {  
      return didDocument;
    }
  }

  for (let framework in registry) {
    for (let kid in registry[framework]) {
      let v = registry[framework][kid]
      
      try {
        if (isPEM)
          v['publicKey'] = didToPEM(v.didDocument);
        else {
          v['publicKeyJwk'] = await didToJWK(v.didDocument);
        }
      } catch(e) {
        console.log(kid)
        //console.log(v.didDocument)
        console.log(e)
      }
      
      delete v.didDocument
    } 
  } 

  fs.writeFile(out_file, JSON.stringify(registry, null, 2), function writeJSON(err) {
    if (err) return console.log(err);
  });
}

await normalize("registry.json", "registry_normalized.json", true);
await normalize("test_registry.json", "test_registry_normalized.json", true);

await normalize("registry.json", "registry_normalized_jwks.json", false);
await normalize("test_registry.json", "test_registry_normalized_jwks.json", false);