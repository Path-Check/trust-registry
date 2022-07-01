import fetch from 'cross-fetch'
import chalk from 'chalk';
import deepEqual from 'deep-equal'

import fs from 'fs';

const colors = {
	added: "\t"+chalk.blue('ℹ'),
	unchanged: "\t"+chalk.green('✔'),
	modified: "\t"+chalk.yellow('⚠'),
	removed: "\t"+chalk.red('✖')
};

function updateFromMasterList(registry, newRegistry) {
  for (const issuerID in newRegistry["ICAO"]) {
    let newReg = newRegistry["ICAO"][issuerID];
    if (!registry["ICAO"][issuerID]) {
      console.log(colors.added, issuerID, 'has been added', newReg);
      registry["ICAO"][issuerID] = newReg;
    } else {
      let oldReg = registry["ICAO"][issuerID];
    
      if (!deepEqual(newReg, oldReg)) {
        registry["ICAO"][issuerID] = newReg;
        console.log(colors.modified, issuerID, 'has changed to ', newReg, " from ", oldReg);
      } else {
        console.log(colors.unchanged, issuerID);
      }
    }
  }

  return registry;
}

export async function update(registry) {
  let masterListHealth = JSON.parse(fs.readFileSync("scripts/ICAO_health_latest.json"));
  let masterList = JSON.parse(fs.readFileSync("scripts/ICAO_ml_latest.json"));

  updateFromMasterList(registry, masterListHealth);
  updateFromMasterList(registry, masterList);

  return registry;
}