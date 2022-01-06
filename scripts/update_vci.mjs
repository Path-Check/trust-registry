import fetch from 'cross-fetch'
import chalk from 'chalk';
import deepEqual from 'deep-equal'

const colors = {
	added: "\t"+chalk.blue('ℹ'),
	unchanged: "\t"+chalk.green('✔'),
	modified: "\t"+chalk.yellow('⚠'),
	removed: "\t"+chalk.red('✖')
};

export async function update(registry) {
  const res = await fetch('https://raw.githubusercontent.com/the-commons-project/vci-directory/main/vci-issuers.json', {method: 'GET', mode: 'no-cors'})
  const VCIMembers = JSON.parse(await res.text());

  const currentCerts = [
    'https://prd.pkey.dhdp.ontariohealth.ca#Nlgwb6GUrU_f0agdYKc77sXM9U8en1gBu94plufPUj8',
    'https://www.gov.nl.ca/covid-19/life-during-covid-19/vaccination-record/prod#UboztS3pE1mr0dnG7Rv24kRNqlYbHrbxd-qBFerpZvI',
    'https://covidrecords.alberta.ca/smarthealth/issuer#JoO-sJHpheZboXdsUK4NtfulfvpiN1GlTdNnXN3XAnM',
    'https://pvc.novascotia.ca/issuer#UJrT9jU8vOCUl4xsI1RZjOPP8hFUv7n9mhVtolqH9qw', 
    'https://smarthealthcard.phsa.ca/v1/issuer#XCqxdhhS7SWlPqihaUXovM_FjU65WeoBFGc_ppent0Q', 
    'https://covid19.quebec.ca/PreuveVaccinaleApi/issuer#qFdl0tDZK9JAWP6g9_cAv57c3KWxMKwvxCrRVSzcxvM', 
    'https://covid19.quebec.ca/PreuveVaccinaleApi/issuer#Nqa1zvChOkoA46B5ZM_oK3MDhL3-mnLERV_30vkHQIc',
    'https://covid19.quebec.ca/PreuveVaccinaleApi/issuer#h4BD-R5WgYT-iXAPzJyOWKTN2iFwMncQ-3k8v3tXm40',
    'https://covid19.quebec.ca/PreuveVaccinaleApi/issuer#2XlWk1UQMqavMtLt-aX35q_q9snFtGgdjH4-Y1gfH1M',
    'https://covid19.quebec.ca/PreuveVaccinaleApi/issuer#sZ5ca2a73SgPl7aC9v4PyA4cR5zk9A6BhHX8I2CVNwM',
    'https://api.cvshealth.com/smarthealth/v1/card#afXT8j9iwJJ7IRP24ZUKPhbkga79MfqPreO2DlK0sLA', 
    'https://api.myirmobile.com/issuer#aQ8UtrF8UuWjSv5yQEgsiYyh_wsyRZ8fouggmtB38I8'
  ];

  // update issuers that are not in VCI. 
  for (const e of currentCerts) {
    const oldReg = registry["SmartHealthCards"][e];
    if (oldReg.status == "current") {
      const [issuer, kid] = e.split('#')
      try {
        const resKeys = await fetch(issuer + "/.well-known/jwks.json", 
          { method: 'GET', 
            mode: 'no-cors',
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            }
          }
        );

        const newKey = JSON.parse(await resKeys.text()).keys.find(e => e.kid === kid);
      
        if (newKey) {
          let newReg = {
            "displayName": oldReg.displayName,
            "entityType": "issuer",
            "status": "current",
            "validFromDT": oldReg.validFromDT,
            "didDocument": newKey, 
            "credentialType": [
              "https://smarthealth.cards#immunization"
            ]
          };

          if (oldReg.displayLogo) {
            newReg['displayLogo'] = oldReg.displayLogo;
          }

          if (!deepEqual(newReg, oldReg)) {
            console.log(colors.modified, oldReg.displayName.en, 'has changed to ', newReg, " from ", oldReg);
          } else {
            console.log(colors.unchanged, oldReg.displayName.en);
          }
        } else {
          console.log(colors.removed, oldReg.displayName.en, "Cannot find", kid, "on", issuer + "/.well-known/jwks.json");
        }
      } catch {
        console.log(colors.removed, oldReg.displayName.en, "Unable to download: ", issuer + "/.well-known/jwks.json");
      }
    } else {
      console.log(colors.unchanged, oldReg.displayName.en, "(" + oldReg.status + ")");
    }
  }

  for (const e of VCIMembers.participating_issuers) {
    try {
      const resKeys = await fetch(e.iss + "/.well-known/jwks.json", 
        { method: 'GET', 
          mode: 'no-cors',
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        }
      );

      const keys = JSON.parse(await resKeys.text());

      for (const newKey of keys.keys) {
        let label = e.iss + "#" + newKey.kid;
        
        currentCerts.push(label);

        if (!registry["SmartHealthCards"][label]) {
          let newReg = {
              "displayName": {  "en": e.name },
              "entityType": "issuer",
              "status": "current",
              "validFromDT": "2021-01-01T01:00:00.000Z",
              "didDocument": newKey, 
              "credentialType": [
                "https://smarthealth.cards#immunization"
              ]
          };

          console.log(colors.added, label, 'has been added', newReg);
          registry["SmartHealthCards"][label] = newReg;
        } else {
          const oldReg = registry["SmartHealthCards"][label];

          let newReg = {
              "displayName": {  "en": e.name },
              "entityType": "issuer",
              "status": "current",
              "validFromDT": "2021-01-01T01:00:00.000Z",
              "didDocument": newKey, 
              "credentialType": [
                "https://smarthealth.cards#immunization"
              ]
          };

          if (oldReg.displayLogo) {
            newReg['displayLogo'] = oldReg.displayLogo;
          }

          if (!deepEqual(newReg, oldReg)) {
            console.log(colors.modified, label, 'has changed to ', newReg, " from ", oldReg);
          } else {
            console.log(colors.unchanged, e.name);
          }
        }
      }
    } catch {
      console.log(colors.removed, e.name, "Unable to download: ", e.iss + "/.well-known/jwks.json");
    }
    
  }

  Object.entries(registry["SmartHealthCards"]).forEach(([k,v]) => {
    if (!currentCerts.includes(k) && v.status === "current") {
      console.log(colors.removed, k, 'has been removed');
    }
  }); 

  return registry;
}