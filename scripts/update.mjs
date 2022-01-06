import * as DCC from './update_dcc.mjs'
import * as VCI from './update_vci.mjs'
import * as ON from './update_ontario.mjs'

import fs from 'fs';

let registry = JSON.parse(fs.readFileSync("registry.json"));

registry = await DCC.update(registry);
registry = await VCI.update(registry);
registry = await ON.update(registry);

fs.writeFile('registry.json', JSON.stringify(registry, null, 2), function writeJSON(err) {
  if (err) return console.log(err);
});
