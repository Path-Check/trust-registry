# Trust Registry by the PathCheck Foundation

This is an implemenation of [ToIP's Trust Registry Protocol V1 Specification](https://wiki.trustoverip.org/display/HOME/ToIP+Trust+Registry+Protocol+Specification) to serve as main repository of trusted issuers of COVID Credentials using multiple standards (EU's DCC, DIVOC, Smart Health Cards, Good Health Pass, etc). 

Entities selected to be in this server have been validated by the PathCheck Foundation or one of its partners. 

# Live API Server

Check an issuer live on our databases: 
```
https://registry.pathcheck.org/query/issuer?governanceFrameworkURI=SmartHealthCards&identifier=https://myvaccinerecord.cdph.ca.gov/creds&credentialType=https://smarthealth.cards%23immunization
```

# Development Overview

This is a NodeJS + Express app

## Running

Install modules:
`npm install`

To run, do:
`npm run dev`

## Testing 

Check an issuer with the following command

```
curl http://localhost:8000/query/issuer?governanceFrameworkURI=SmartHealthCards&identifier=https://myvaccinerecord.cdph.ca.gov/creds&credentialType=https://smarthealth.cards%23immunization
```

To run all tests, do: 

`npm tests`

## Generating new Version

GitHub Actions generates a new [Release](https://github.com/Path-Check/simple-trust-registry/releases) when npm version is run and pushed to the repo.

```
npm version <version number: x.x.x>
```

## Contributing

[Issues](https://github.com/Path-Check/simple-trust-registry/issues) and [pull requests](https://github.com/Path-Check/simple-trust-registry/pulls) are very welcome! :)

