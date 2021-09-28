# Trust Registry for COVID Credentials by the PathCheck Foundation

This is an implemenation of [ToIP's Trust Registry Protocol V1 Specification](https://wiki.trustoverip.org/display/HOME/ToIP+Trust+Registry+Protocol+Specification).

# Development Overview

This is a NodeJS + Express app

## Running

Install modules:
`npm install`

To run, do:
`npm run dev`

## Testing 

Create a new QR code using the following command

`curl http://localhost:8000/query/issuer?governanceFrameworkURI=SmartHealthCards&identifier=https://myvaccinerecord.cdph.ca.gov/creds&credentialType=https://smarthealth.cards#immunization`


## Generating new Version

GitHub Actions generates a new [Release](https://github.com/Path-Check/simple-trust-registry/releases) when npm version is run and pushed to the repo.

```
npm version <version number: x.x.x>
```

## Contributing

[Issues](https://github.com/Path-Check/simple-trust-registry/issues) and [pull requests](https://github.com/Path-Check/simple-trust-registry/pulls) are very welcome! :)

