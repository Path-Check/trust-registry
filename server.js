const express = require("express");
const app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const port = process.env.PORT || "8000";

// Trust Over IP Trust Registry Protocol (RESTful API)

const DBIssuers = {
    "SmartHealthCards": {
        "https://myvaccinerecord.cdph.ca.gov/creds": {
            "https://smarthealth.cards#immunization" : {
                displayName: "State of California",
                entityType: "issuer",
                status: "current",   
                validFromDT: new Date(), 
                didDocument: { 
                    'jkws': {
                            "keys": [
                                {
                                "kty": "EC",
                                "kid": "7JvktUpf1_9NPwdM-70FJT3YdyTiSe2IvmVxxgDSRb0",
                                "use": "sig",
                                "alg": "ES256",
                                "crv": "P-256",
                                "x": "3dQz5ZlbazChP3U7bdqShfF0fvSXLXD9WMa1kqqH6i4",
                                "y": "FV4AsWjc7ZmfhSiHsw2gjnDMKNLwNqi2jMLmJpiKWtE"
                                }
                            ]
                        }
                    }
            }
        }
    }
};
const DBVerifiers = {}
const DBTrustRegistries = {}

/**
    Data Model: 

    DIDDocument:                 // Provides a URI that resolves to the DID Document for the Identifier. 
    entityType:                  // One of [issuer, verifier, trustregistry]
    status:                      // One of [current, expired, terminated, revoked]
    validFromDT:                 // date-time
    validUntilDT:                // date-time
 */

/* 
 * Allows querying to determine the status of an Issuer, as identified by their Identifier (unique), credential type, 
 * and EGF that they are operating under.
 */
app.get('/query/issuer', async function (req, res) {
    console.log(req.query.identifier);              // The URI-based identifier of a DID or X.509 Issuer. 
    console.log(req.query.credentialType);          // String
    console.log(req.query.governanceFrameworkURI);  // The URI that points to the Ecosystem Governance Framework.

    const issuer = DBIssuers[req.query.governanceFrameworkURI][req.query.identifier][req.query.credentialType];

    console.log(req.query.credentialType);

    let response = {
        identifier: req.query.identifier,
        credentialType: req.query.credentialType,
        governanceFrameworkURI: req.query.governanceFrameworkURI,
        ... issuer
    }

    res.send(response);
});

/* 
 * Allows querying to determine the status of an Verifier, as identified by their Identifier (unique), credential type, 
 * and EGF that they are operating under.
 */
app.get('/query/verifier', async function (req, res) {
    console.log(req.query.identifier);             // The URI-based identifier of a DID or X.509 Verifier. 
    console.log(req.query.credentialType);         // String
    console.log(req.query.governanceFrameworkURI); // The URI that points to the Ecosystem Governance Framework.

    // all verifiers are allowed. 
    let response = {
        identifier: req.query.identifier,
        credentialType: req.query.credentialType,
        governanceFrameworkURI: req.query.governanceFrameworkURI,
        entityType: "verifier",
        status: "current",   
        validFromDT: new Date(), 
    }

    res.send(response);
});

/* 
 * Allows querying to get an answer if this Trust Registry has a trust relationship with the identified Trust Registry. 
 * If one exists the returned status provides indicator of the trust relationship. 
 */
app.get('/query/trustregistry', async function (req, res) {
    console.log(req.query.identifier);              // The URI-based identifier of a DID or X.509 Issuer or Verifier. 
    console.log(req.query.credentialType);          // String
    console.log(req.query.governanceFrameworkURI);  // The URI that points to the Ecosystem Governance Framework.

    const issuer = DBTrustRegistries[req.query.governanceFrameworkURI][req.query.identifier][req.query.credentialType];

    let response = {
        identifier: req.query.identifier,
        credentialType: req.query.credentialType,
        governanceFrameworkURI: req.query.governanceFrameworkURI,
        ... issuer
    }

    res.send(response);
});

/* 
 * Allows querying to determine the status of an Issuer, as identified by their Identifier (unique), credential type, 
 * and EGF that they are operating under.
 * 
 * Returns: JSON file array of offline list of Issuers. 
 */
app.get('/query/getofflinefile', async function (req, res) {
    let response = {
        validAtDT: new Date(),
        items: DBIssuers
    }

    res.send(response);
});


app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});