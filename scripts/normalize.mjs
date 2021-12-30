import { Certificate, PublicKey } from '@fidm/x509'
import jwkToPem from 'jwk-to-pem'


import fs from 'fs';

let registry = JSON.parse(fs.readFileSync("registry.json"));

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
      console.log(e)
    }
    
    delete v.didDocument
  } 
} 


fs.writeFile('registry_normalized.json', JSON.stringify(registry, null, 2), function writeJSON(err) {
  if (err) return console.log(err);
});

