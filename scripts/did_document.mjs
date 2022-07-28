import fs from 'fs';
import jsigs from 'jsonld-signatures';
import {Ed25519VerificationKey2020} from '@digitalbazaar/ed25519-verification-key-2020';
import {Ed25519Signature2020, suiteContext} from '@digitalbazaar/ed25519-signature-2020';
import jsonld from "jsonld";
const {purposes: {AssertionProofPurpose}} = jsigs;

const privateKey = process.argv.slice(2)[0];

import {resolveDID} from './DIDWEBResolver.mjs'

let registry = JSON.parse(fs.readFileSync("registry_normalized_jwks.json"));

let did = "did:web:raw.githubusercontent.com:Path-Check:trust-registry:main";

let didDocument = {
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/jws-2020/v1", 
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  id: did,
  verificationMethod: [],
  assertionMethod: [] 
};

for (let framework in registry) {
  for (let kid in registry[framework]) {
    let v = registry[framework][kid]
    let didKeyID = framework+"#"+kid;
    
    if (v.publicKeyJwk) {
      didDocument.verificationMethod.push({
        "id": did+"#"+didKeyID,
        "type": "JsonWebKey2020",
        "controller": did,
        "publicKeyJwk": v.publicKeyJwk
      });
    }
    didDocument.assertionMethod.push("#"+didKeyID);
  } 
} 

// Sign DidDocument
const mockKeyPair = {
  id: 'did:web:raw.githubusercontent.com:Path-Check:trust-registry:main:signer#WEB',
  type: 'Ed25519VerificationKey2020',
  controller: 'did:web:raw.githubusercontent.com:Path-Check:trust-registry:main:signer',
  publicKeyMultibase: 'z6MkkQRSRnwoZbR5rmZKvNkvpjawFQH8FCZi1G1FKKHT5sub',
  privateKeyMultibase: privateKey 
}

const signerController = {
  '@context': 'https://w3id.org/security/v3-unstable',
  id: mockKeyPair.controller,
  assertionMethod: [mockKeyPair.id],
  authentication: [mockKeyPair.id]
};

const keyPair = await Ed25519VerificationKey2020.from(mockKeyPair);
const suite = new Ed25519Signature2020({key: keyPair});

const documentLoader = jsonld.documentLoaders.node();
const wrappedDocumentLoader = async (url) => {
  if (url.startsWith("did:web")) {
    const document = await resolveDID(url);
    if (document.didResolutionMetadata.error) {
      console.log(document.didResolutionMetadata.error, document.didResolutionMetadata.message);
    }
    return {
      url,
      document: document.didDocument,
      static: true
    }
  }
  return documentLoader(url);
};

const signed = await jsigs.sign(didDocument, {
  documentLoader: wrappedDocumentLoader,
  suite: suite,
  purpose: new AssertionProofPurpose({ controller: signerController }),
  compactProof: false
});

const result = await jsigs.verify(signed, {
  documentLoader: wrappedDocumentLoader,
  suite: new Ed25519Signature2020(),
  purpose: new AssertionProofPurpose({ controller: signerController })
});

console.log("DID Document is Verifiable: ", result.verified)

fs.writeFile('did.json', JSON.stringify(signed, null, 2), function writeJSON(err) {
  if (err) return console.log(err);
});

