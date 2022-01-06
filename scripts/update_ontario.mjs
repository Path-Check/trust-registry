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
  const res = await fetch('https://files.ontario.ca/apps/verify/verifyRulesetON.json', {method: 'GET', mode: 'no-cors'})
  const ONMembers = JSON.parse(await res.text()).publicKeys;

  for (const issuerURL in ONMembers) {
    try {
      const resKeys = await fetch(issuerURL + "/.well-known/jwks.json", 
        { method: 'GET', 
          mode: 'no-cors',
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        }
      );

      const keys = JSON.parse(await resKeys.text());
      const allKeys = keys.keys.concat(ONMembers[issuerURL].keys)

      for (const newKey of allKeys) {
        let label = issuerURL + "#" + newKey.kid;

        if (!registry["SmartHealthCards"][label]) {
          let newReg = {
              "displayName": {  "en": "" },
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
              "displayName": {  "en": oldReg.displayName.en },
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
            console.log(colors.unchanged, label);
          }
        }
      }
    } catch (e) {
      console.log(e)
      console.log(colors.removed, "Unable to download: ", issuerURL + "/.well-known/jwks.json");
    }
    
  }

  return registry;
}