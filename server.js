import sslRedirect from 'heroku-ssl-redirect';
import express from 'express';

const app = express();

const port = process.env.PORT || "8000";

// Trust Over IP Trust Registry Protocol (RESTful API)

/**
 *  Data Model: 
 *
 *  identifier:             The URI-based identifier of a DID or X.509 Issuer or Verifier. 
 *  credentialType:         String
 *  governanceFrameworkURI: The URI that points to the Ecosystem Governance Framework.
 *  DIDDocument:            Provides a URI that resolves to the DID Document for the Identifier. 
 *  entityType:             One of [issuer, verifier, trustregistry]
 *  status:                 One of [current, expired, terminated, revoked]
 *  validFromDT:            date-time
 *  validUntilDT:           date-time
 */

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

function filter(DB, req, res) {
    if (!DB[req.query.governanceFrameworkURI]) {
        res.status(404).send({
            title: "The Governance framework " + req.query.governanceFrameworkURI + " was not found",
            status: 404
        })
        return undefined;
    }

    if (!DB[req.query.governanceFrameworkURI][req.query.identifier]) {
        res.status(404).send({
            title: "Identifier " + req.query.identifier + " is not registered under " + req.query.governanceFrameworkURI,
            status: 404
        })
        return undefined;
    }

    if (!DB[req.query.governanceFrameworkURI][req.query.identifier][req.query.credentialType]) {
        res.status(404).send({
            title: "Identifier " + req.query.identifier + " is not approved for the credential type " + req.query.credentialType,
            status: 404
        })
        return undefined;
    }

    return DB[req.query.governanceFrameworkURI][req.query.identifier][req.query.credentialType];
} 

/* 
 * Allows querying to determine the status of an Issuer, as identified by their Identifier (unique), credential type, 
 * and EGF that they are operating under.
 *
 * Params: 
 *  req.query.identifier:             The URI-based identifier of a DID or X.509 Issuer or Verifier. 
 *  req.query.credentialType:         String
 *  req.query.governanceFrameworkURI: The URI that points to the Ecosystem Governance Framework.
 */
app.get('/query/issuer', async function (req, res) {
    const issuer = filter(DBIssuers, req, res);

    if (issuer) {
        let response = {
            identifier: req.query.identifier,
            credentialType: req.query.credentialType,
            governanceFrameworkURI: req.query.governanceFrameworkURI,
            ... issuer
        }

        res.send(response);
    }
});

/* 
 * Allows querying to determine the status of an Verifier, as identified by their Identifier (unique), credential type, 
 * and EGF that they are operating under.
 *
 * Params: 
 *  req.query.identifier:             The URI-based identifier of a DID or X.509 Issuer or Verifier. 
 *  req.query.credentialType:         String
 *  req.query.governanceFrameworkURI: The URI that points to the Ecosystem Governance Framework.
 */
app.get('/query/verifier', async function (req, res) {
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
 *
 * Params: 
 *  req.query.identifier:             The URI-based identifier of a DID or X.509 Issuer or Verifier. 
 *  req.query.credentialType:         String
 *  req.query.governanceFrameworkURI: The URI that points to the Ecosystem Governance Framework.
 */
app.get('/query/trustregistry', async function (req, res) {
    const registry = filter(DBTrustRegistries, req, res);

    if (registry) {
        let response = {
            identifier: req.query.identifier,
            credentialType: req.query.credentialType,
            governanceFrameworkURI: req.query.governanceFrameworkURI,
            ... registry
        }

        res.send(response);
    }
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