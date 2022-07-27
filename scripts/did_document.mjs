import { Certificate, PublicKey } from '@fidm/x509'

import fs from 'fs';

let registry = JSON.parse(fs.readFileSync("registry_normalized_jwks.json"));

let today = new Date();

let did = "did:web:raw.githubusercontent.com:Path-Check:trust-registry:main";

let didDocument = {
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1"
  ],
  id: did,
  verificationMethod: [],
  assertionMethod: [] 
};

for (let framework in registry) {
  for (let kid in registry[framework]) {
    let v = registry[framework][kid]
    
    didDocument.verificationMethod.push({
      "id": did+"#"+framework+"#"+kid,
      "type": "JsonWebKey2020",
      "controller": did,
      "publicKeyJwk": v.publicKeyJwk
    });
    didDocument.assertionMethod.push(framework+"#"+kid);
  } 
} 

fs.writeFile('did.json', JSON.stringify(didDocument, null, 2), function writeJSON(err) {
  if (err) return console.log(err);
});

