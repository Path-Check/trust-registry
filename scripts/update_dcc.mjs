import fetch from 'cross-fetch'
import Countries from 'i18n-iso-countries'

import { Certificate } from '@fidm/x509'

function getDisplayName(country) {
  let name = Countries.getName(country, "en")

  if (name.includes(',')) {
    name = name.split(',')[0]
  }

  let article = ""
  if (["NL", "VA", "FO"].includes(country))
    article = "the "

  return "Gov of " + article + name;
}

function getPEM(base64PEM, type) {
  return `-----BEGIN ${type}-----
${base64PEM}
-----END ${type}-----`;
}

function getCertPEM(base64PEM) {
  return getPEM(base64PEM, 'CERTIFICATE');
}

function getPublicKeyPEM(base64PEM) {
  return getPEM(base64PEM, 'PUBLIC KEY');
}

// Usage OIDs
const OID_TEST = ["1.3.6.1.4.1.1847.2021.1.1", "1.3.6.1.4.1.0.1847.2021.1.1"]
const OID_VACCINATION = ["1.3.6.1.4.1.1847.2021.1.2", "1.3.6.1.4.1.0.1847.2021.1.2"]
const OID_RECOVERY = ["1.3.6.1.4.1.1847.2021.1.3", "1.3.6.1.4.1.0.1847.2021.1.3"]

function getCredentialTypes(cert) { 
  let credentialType = [];
  let usageTypes = cert.getExtension('extKeyUsage');
  if (usageTypes) {
    if (usageTypes[OID_TEST[0]] || usageTypes[OID_TEST[1]]) {
      credentialType.push('t');
    }
    if (usageTypes[OID_VACCINATION[0]] || usageTypes[OID_VACCINATION[1]]) {
      credentialType.push('v');
    }
    if (usageTypes[OID_RECOVERY[0]] || usageTypes[OID_RECOVERY[1]]) {
      credentialType.push('r');
    }
  }

  if (credentialType.length === 0) {
    credentialType = ['t', 'v', 'r']; // If not specified, the credential performs everything. 
  }
  return credentialType;
}

function hasExpired(date) {
  return date.getTime() < new Date().getTime();
}

export async function update(registry) {
  const res = await fetch('https://de.dscg.ubirch.com/trustList/DSC', {method: 'GET', mode: 'no-cors'})
  const DSC = JSON.parse((await res.text()).split('\n')[1])

  const currentCerts = ['AM6ZZ6DrF1I=']; // Uruguay's key is fixed.

  DSC.certificates.forEach((e) => {
    currentCerts.push(e.kid);

    let certPEM = getCertPEM(e.rawData);
    let cert = Certificate.fromPEM(certPEM);

    let newReg = {
      "displayName": {  "en": getDisplayName(e.country) },
      "entityType": "issuer",
      "status": hasExpired(cert.validTo) ? "expired" : "current",
      "credentialType": getCredentialTypes(cert),
      "validFromDT": cert.validFrom.toISOString().replace(".000Z", ""),
      "validUntilDT": cert.validTo.toISOString().replace(".000Z", ""),
      "didDocument": certPEM
    }

    if (!registry["EUDCC"][e.kid]) {
      console.log(e.kid, 'has been added', newReg);
      registry["EUDCC"][e.kid] = newReg;
    } else {
      const oldReg = registry["EUDCC"][e.kid];

      if (newReg.validFromDT !== oldReg.validFromDT) {
        console.log(e.kid, 'has changed Valid From Date', newReg.validFromDT, oldReg.validFromDT);
        oldReg.validFromDT = newReg.validFromDT;
      }
      if (newReg.validUntilDT !== oldReg.validUntilDT) {
        console.log(e.kid, 'has changed Valid Until Date', newReg.validUntilDT, oldReg.validUntilDT);
        oldReg.validUntilDT = newReg.validUntilDT;
      }
      if (newReg.didDocument !== oldReg.didDocument) {
        console.log(e.kid, 'has changed Certificate PEM', newReg.didDocument, oldReg.didDocument);
      }
      if (JSON.stringify(newReg.credentialType) !== JSON.stringify(oldReg.credentialType)) {
        console.log(e.kid, 'has changed credential types', newReg.credentialType, oldReg.credentialType);
        oldReg.credentialType = newReg.credentialType;
      }
    }
  }); 

  const resUK = await fetch('https://covid-status.service.nhsx.nhs.uk/pubkeys/keys.json', {method: 'GET', mode: 'no-cors'})
  const UKKeys = JSON.parse(await resUK.text());
  
  UKKeys.forEach((e) => {
    currentCerts.push(e.kid);

    let displayName = "Gov of the United Kingdom";
    let pubKeyPEM = getPublicKeyPEM(e.publicKey);
    
    let newReg = {
      "displayName": {  "en": displayName },
      "entityType": "issuer",
      "status": "current",
      "credentialType": ['t', 'v', 'r'],
      "validFromDT": "2021-01-01T01:00:00.000Z",
      "didDocument": pubKeyPEM
    }

    if (!registry["EUDCC"][e.kid]) {
      console.log(e.kid, 'has been added', newReg);
    } else {
      const oldReg = registry["EUDCC"][e.kid];

      if (newReg.validFromDT !== oldReg.validFromDT) {
        console.log(e.kid, 'has changed Valid From Date', newReg.validFromDT, oldReg.validFromDT);
        oldReg.validFromDT = newReg.validFromDT;
      }
      if (newReg.validUntilDT !== oldReg.validUntilDT) {
        console.log(e.kid, 'has changed Valid Until Date', newReg.validUntilDT, oldReg.validUntilDT);
        oldReg.validUntilDT = newReg.validUntilDT;
      }
      if (newReg.didDocument !== oldReg.didDocument) {
        console.log(e.kid, 'has changed Public Key PEM', newReg.didDocument, oldReg.didDocument);
      }
      if (JSON.stringify(newReg.credentialType) !== JSON.stringify(oldReg.credentialType)) {
        console.log(e.kid, 'has changed credential types', newReg.credentialType, oldReg.credentialType);
        oldReg.credentialType = newReg.credentialType;
      }
    }
  });  

  Object.entries(registry["EUDCC"]).forEach(([k,v]) => {
    if (!currentCerts.includes(k)) {
      console.log(k, 'has been removed');
    }
  }); 

  return registry;
}