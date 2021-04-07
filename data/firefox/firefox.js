//@ts-check

// ⌥ save to commented YAML

const {assert} = require ('console');
const fs = require ('fs');
const fsp = fs.promises;
const {knuthShuffle} = require ('knuth-shuffle');  // https://stackoverflow.com/a/2450976/257568
const os = require ('os');
const {log, snooze} = require ('log');

class Tab {
  /**
   * @param {string} url
   */
  constructor (url) {
    /** @type {string} */
    this.url = url}}

exports.Tab = Tab

const win = process.platform == 'win32'

/** @returns {Promise<string>} Directory with Firefox profiles */
exports.profiles = async function() {
  const env = process.env['FIREFOX_PROFILES']
  if (fs.existsSync (env)) return env

  // https://support.mozilla.org/en-US/kb/profiles-where-firefox-stores-user-data#w_finding-your-profile-without-opening-firefox
  // “C:\Users\<your Windows login username>\AppData\Roaming\Mozilla\Firefox\Profiles\”
  if (win) {
    const appdata = process.env['APPDATA']
    if (appdata) {
      const profiles = appdata + '\\Mozilla\\Firefox\\Profiles'
      if (fs.existsSync (profiles)) return profiles}}

  throw new Error ('!FIREFOX_PROFILES')}

/**
 * @returns {Promise<Tab[]>}
 */
exports.tabs = async function() {
  const profiles = await exports.profiles()
  const profilesʹ = await fsp.readdir (profiles)
  log (profilesʹ)

  // ⌥ sort the profiles by last-modified, in order to pick the recent/actual one

  return []}

exports.test = async function() {
  const tabs = await exports.tabs()
  assert (tabs && tabs.length)}

function help() {
  console.log ('npm i && node firefox.js --tabs')}

// When invoked from console, “npm i && node firefox.js --tabs”
// cf. https://nodejs.org/dist/latest-v15.x/docs/api/modules.html#modules_accessing_the_main_module
if (require.main === module) (async () => {
  if (process.argv.includes ('--help')) {help(); return}
  if (process.argv.includes ('--tabs')) {
    const tabs = await exports.tabs()
    for (const tab of tabs) {console.log (tab.url)}
    return}

  const shuffleʹ = process.env['STEAM_SHUFFLE']
  const shuffle = shuffleʹ ? parseInt (shuffleʹ) : (process.argv.includes ('--shuffle') ? 9 : 0)
})()
