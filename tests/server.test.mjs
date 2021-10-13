// Import the dependencies for testing
import chai from "chai";
import chaiHttp from "chai-http";
import app from "../server.mjs";

// Configure chai
chai.use(chaiHttp);
chai.should();

describe("Trust Registry", () => {
  // Test to get all students record
  it("should get SHC keys for California", (done) => {
    const EXPECTED = {
      identifier: "https://myvaccinerecord.cdph.ca.gov/creds",
      credentialType: "https://smarthealth.cards#immunization",
      governanceFrameworkURI: "SmartHealthCards",
      displayName: { en: "State of California" },
      entityType: "issuer",
      status: "current",
      validFromDT: "2021-01-01T01:00:00.000Z",
      didDocument: {
        jwks: {
          keys: [
            {
              kty: "EC",
              kid: "7JvktUpf1_9NPwdM-70FJT3YdyTiSe2IvmVxxgDSRb0",
              use: "sig",
              alg: "ES256",
              crv: "P-256",
              x: "3dQz5ZlbazChP3U7bdqShfF0fvSXLXD9WMa1kqqH6i4",
              y: "FV4AsWjc7ZmfhSiHsw2gjnDMKNLwNqi2jMLmJpiKWtE",
            },
          ],
        },
      },
    };

    chai
      .request(app)
      .get(
        "/query/issuer?governanceFrameworkURI=SmartHealthCards&identifier=https://myvaccinerecord.cdph.ca.gov/creds&credentialType=https://smarthealth.cards%23immunization"
      )
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.be.deep.equal(EXPECTED);
        done();
      });
  });

  it("should not have a Pablo governance framework", (done) => {
    const EXPECTED = {
      title: 'The Governance framework Pablo was not found',
      status: 404
    };

    chai
      .request(app)
      .get(
        "/query/issuer?governanceFrameworkURI=Pablo&identifier=ID&credentialType=Type"
      )
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.a("object");
        res.body.should.be.deep.equal(EXPECTED);
        done();
      });
  });

  it("should not have an ID issuer within the SmartHealthCards GF", (done) => {
    const EXPECTED = {
      title: "Identifier ID is not registered under SmartHealthCards",
      status: 404
    };

    chai
      .request(app)
      .get(
        "/query/issuer?governanceFrameworkURI=SmartHealthCards&identifier=ID&credentialType=Type"
      )
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.a("object");
        res.body.should.be.deep.equal(EXPECTED);
        done();
      });
  });

  it("should not allow a Verifiable Credential type for California's keys", (done) => {
    const EXPECTED = {
      title: "Identifier https://myvaccinerecord.cdph.ca.gov/creds is not approved for the credential type VerifiableCredential",
      status: 404
    };

    chai
      .request(app)
      .get(
        "/query/issuer?governanceFrameworkURI=SmartHealthCards&identifier=https://myvaccinerecord.cdph.ca.gov/creds&credentialType=VerifiableCredential"
      )
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.a("object");
        res.body.should.be.deep.equal(EXPECTED);
        done();
      });
  });

  it("should not allow California's keys to be used in the DCC Governance Framework", (done) => {
    const EXPECTED = {
      title: "Identifier https://myvaccinerecord.cdph.ca.gov/creds is not registered under EUDCC",
      status: 404
    };

    chai
      .request(app)
      .get(
        "/query/issuer?governanceFrameworkURI=EUDCC&identifier=https://myvaccinerecord.cdph.ca.gov/creds&credentialType=VerifiableCredential"
      )
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.a("object");
        res.body.should.be.deep.equal(EXPECTED);
        done();
      });
  });

  it("should not allow a missing governance framework", (done) => {
    const EXPECTED = {
      title: "The Governance framework undefined was not found",
      status: 404
    };

    chai
      .request(app)
      .get(
        "/query/issuer"
      )
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.a("object");
        res.body.should.be.deep.equal(EXPECTED);
        done();
      });
  });
});
