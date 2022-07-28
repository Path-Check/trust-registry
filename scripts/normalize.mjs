import { Certificate, PublicKey } from '@fidm/x509'
import jwkToPem from 'jwk-to-pem'

import { createPrivateKey, createPublicKey } from "crypto"

import fs from 'fs';

async function normalize(registry_file, out_file, isPEM) {
  let registry_source = JSON.parse(fs.readFileSync(registry_file));

  function cleanPEM(pem) {
    return pem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").replace(/\n/g, "").replace(/\r/g, "")
  }

  function cleanPEMCert(pem) {
    return pem.replace("-----BEGIN CERTIFICATE-----", "").replace("-----END CERTIFICATE-----", "").replace(/\n/g, "").replace(/\r/g, "")
  }

  let registry = {} 
  // Rename frameworks 
  registry["CRED"] = registry_source["CRED"] 
  registry["ICAO"] = registry_source["ICAO"] 
  registry["DIVOC"] = registry_source["DIVOC"] 
  registry["DCC"] = registry_source["EUDCC"] 
  registry["SHC"] = registry_source["SmartHealthCards"] 

  // Builds the certificate stack
  let certs = {}
  for (let framework in registry) {
    for (let kid in registry[framework]) {
      let v = registry[framework][kid]
      try {
        if (typeof (v.didDocument) === "string" && v.didDocument.includes("CERTIFICATE")) {
          let cert = Certificate.fromPEM(v.didDocument);
          certs[cert.subjectKeyIdentifier] = v.didDocument;
        }
      } catch(e) {
      }
    } 
  } 

  const res = await fetch('https://de.dscg.ubirch.com/trustList/CSCA', {method: 'GET', mode: 'no-cors'})
  const CSCAs = JSON.parse((await res.text()).split('\n')[1])

  CSCAs.certificates.forEach((e) => {
    let certPEM = `-----BEGIN CERTIFICATE-----\n${e.rawData}\n-----END CERTIFICATE-----`;
    let cert = Certificate.fromPEM(certPEM);

    if (cert.subjectKeyIdentifier)
      certs[cert.subjectKeyIdentifier] = certPEM;
  });

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

  function findChain(didDocument, kid) {
    let cert = Certificate.fromPEM(didDocument);
    let x5c = [cleanPEMCert(didDocument)];

    if (cert.subjectKeyIdentifier && cert.subjectKeyIdentifier != cert.authorityKeyIdentifier) {
      if (cert.authorityKeyIdentifier in certs) {
        x5c.push(...findChain(certs[cert.authorityKeyIdentifier], kid))
      } else {
        console.log(kid + ": Certificate Not Found: " + cert.authorityKeyIdentifier);
      }
    }

    return x5c;
  }

  async function didToJWK(didDocument, kid) {
    if (typeof (didDocument) === "string") {
      if (didDocument.includes("CERTIFICATE")) {
        let jwk = createPublicKey(didDocument).export({format: 'jwk'});
        jwk['x5c'] = findChain(didDocument, kid)
        return jwk;
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
          v['publicKeyJwk'] = await didToJWK(v.didDocument, framework + ":" + kid);
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

console.log("Production");
await normalize("registry.json", "registry_normalized.json", true);
await normalize("registry.json", "registry_normalized_jwks.json", false);

console.log("Test");
await normalize("test_registry.json", "test_registry_normalized.json", true);
await normalize("test_registry.json", "test_registry_normalized_jwks.json", false);