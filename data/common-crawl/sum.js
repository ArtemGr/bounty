//@ts-check

const fs = require ('fs'); const fsp = fs.promises;
const {log} = require ('log');
const os = require ('os');
const yaml = require ('yaml')  // https://github.com/eemeli/yaml

const dlˢ = fs.readFileSync (os.homedir() + '/.common-crawl-dl.yaml', {encoding: 'utf8'})
const dl = yaml.parse (dlˢ)

let sum = 0

for (const en of dl) {
  sum += en.downloaded}

log (sum)
log (`${sum / 1024 / 1024 / 1024} GiB`)
