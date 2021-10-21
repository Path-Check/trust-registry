import sslRedirect from "heroku-ssl-redirect";
import express from "express";
const app = express();

// enable ssl redirect
app.use(sslRedirect.default());

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
 *    Current (active)
 *    Expired (not renewed after the previous valid registration period)
 *    Terminated (voluntary termination by the registered party)
 *    Revoked (involuntary termination by the governing authority)
 *  statusDetail            Optional free text that expands on the status parameter.
 *  validFromDT:            Indicates that the Identifier status applies at the indicated time. 
 *  validUntilDT:           Indicates the the Identifier validity ends/ended at this date and time. 
 *
 *  extras:
 *  displayName:            i18n Display Names
 */

import DBIssuers from './registry.json';
const DBVerifiers = {};
const DBTrustRegistries = {};

function filter(DB, req, res) {
  if (!DB[req.query.governanceFrameworkURI]) {
    res.status(404).send({
      title:
        "The Governance framework " +
        req.query.governanceFrameworkURI +
        " was not found",
      status: 404,
    });
    return undefined;
  }

  if (!DB[req.query.governanceFrameworkURI][req.query.identifier]) {
    res.status(404).send({
      title:
        "Identifier " +
        req.query.identifier +
        " is not registered under " +
        req.query.governanceFrameworkURI,
      status: 404,
    });
    return undefined;
  }

  if (!DB[req.query.governanceFrameworkURI][req.query.identifier].credentialType.includes(req.query.credentialType)) {
    res.status(404).send({
      title:
        "Identifier " +
        req.query.identifier +
        " is not approved for the credential type " +
        req.query.credentialType,
      status: 404,
    });
    return undefined;
  }

  return DB[req.query.governanceFrameworkURI][req.query.identifier];
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
app.get("/query/issuer", async function (req, res) {
  const issuer = filter(DBIssuers, req, res);

  if (issuer) {
    let response = {
      identifier: req.query.identifier,
      credentialType: req.query.credentialType,
      governanceFrameworkURI: req.query.governanceFrameworkURI,
      ...issuer,
    };

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
app.get("/query/verifier", async function (req, res) {
  // all verifiers are allowed.
  let response = {
    identifier: req.query.identifier,
    credentialType: req.query.credentialType,
    governanceFrameworkURI: req.query.governanceFrameworkURI,
    entityType: "verifier",
    status: "current",
    validFromDT: new Date(),
  };

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
app.get("/query/trustregistry", async function (req, res) {
  const registry = filter(DBTrustRegistries, req, res);

  if (registry) {
    let response = {
      identifier: req.query.identifier,
      credentialType: req.query.credentialType,
      governanceFrameworkURI: req.query.governanceFrameworkURI,
      ...registry,
    };

    res.send(response);
  }
});

/*
 * Allows querying to determine the status of an Issuer, as identified by their Identifier (unique), credential type,
 * and EGF that they are operating under.
 *
 * Returns: JSON file array of offline list of Issuers.
 */
app.get("/query/getofflinefile", async function (req, res) {
  let response = {
    validAtDT: new Date(),
    items: DBIssuers,
  };

  res.send(response);
});

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});

// Export our app for testing purposes
export default app;