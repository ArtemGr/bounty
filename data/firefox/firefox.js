//@ts-check

const {assert} = require ('console');
const date = require ('date-and-time');
const fs = require ('fs');
const fsp = fs.promises;
const {knuthShuffle} = require ('knuth-shuffle');  // https://stackoverflow.com/a/2450976/257568
const lz4 = require ('lz4');
const {log, snooze} = require ('log');
const os = require ('os');
const yaml = require ('yaml');  // https://github.com/eemeli/yaml

/**
 * @typedef {Object} Tab
 * @property {string} url The latest address we've got for a tab
 * @property {string} title As obtained from the session JSON
 */

/** @returns {Promise<Tab[]>} Loaded from “~/.path/tabs.yaml” */
exports.loadTabs = async function() {
  // cf. https://stackoverflow.com/questions/14391690/how-to-capture-no-file-for-fs-readfilesync
  let tabsˢ
  try {
    tabsˢ = await fsp.readFile (os.homedir() + '/.path/tabs.yaml', {encoding: 'utf8'})
  } catch (err) {
    if (err.code == 'ENOENT') tabsˢ = '[]'
    else throw err}
  if (tabsˢ === '') tabsˢ = '[]'
  return yaml.parse (tabsˢ)}

/** @param {Tab[]} tabs For “~/.path/tabs.yaml” */
exports.saveTabs = async function (tabs) {
  const tabsᵈ = new yaml.Document (tabs)

  if (tabs.length != 0) {  // Document the database with YAML comments
    const tabᵐ = /** @type {yaml.YAMLMap} */ (tabsᵈ.get (0, true))
    tabᵐ.commentBefore = ' Tabs gathered from the Firefox “recovery.jsonlz4”'
      + '\n Moving them into a separate database allows us to close the tabs in the browser'
      + '\n and work from a clean slate there.'
      + '\n We can also shuffle the saved tabs and mix them with other tasks.'
      + '\n '
    const comm = (name, comment) => {
      const node = /** @type {yaml.Node} */ (tabᵐ.get (name, true))
      if (node) node.commentBefore = comment}
    comm ('url', ' The latest address we\'ve got for a tab')
    comm ('title', ' As obtained from the session JSON')}

  const tabsᵖ = os.homedir() + '/.path/tabs.yaml'
  const tabsᵗ = tabsᵖ + '.' + Date.now() + '.tmp'
  await fsp.writeFile (tabsᵗ, tabsᵈ.toString())
  await fsp.rename (tabsᵗ, tabsᵖ)}

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
  if (!profilesʹ.length) throw new Error (`No profiles at "${profiles}"`)

  // Sort the profiles by last-modified, in order to pick the recent/actual one
  const lm = /** @type {Map<string, number>} */ (new Map())
  const lmᶠ = /** @param {string} pname */ pname => {
    let ms = lm.get (pname)
    if (!ms) {
      const pstat = fs.statSync (`${profiles}/${pname}`)
      const bexists = fs.existsSync (`${profiles}/${pname}/sessionstore-backups`)
      ms = pstat.isDirectory() && bexists ? pstat.mtimeMs : -1
      lm.set (pname, ms)}
    return ms}
  profilesʹ.sort ((a, b) => lmᶠ (b) - lmᶠ (a))

  const pname = profilesʹ[0]
  const recoveryᵖ = `${profiles}/${pname}/sessionstore-backups/recovery.jsonlz4`
  const lz4bytes = await fsp.readFile (recoveryᵖ)
  // cf. https://github.com/toashd/mozlz4/blob/d94719e5bae9e9dbd3e64847f91ab61e8646ad8d/index.js#L30
  const magic = 'mozLz40\0'
  assert (lz4bytes.slice (0, 8) .toString ('utf8') == magic)
  const lz4len = lz4bytes.readUInt32LE (8)  // bytes 8..12
  const lz4buf = Buffer.alloc (lz4len)
  const lz4lenʹ = lz4.decodeBlock (lz4bytes, lz4buf, 12)
  assert (lz4lenʹ == lz4len && lz4len == lz4buf.length)
  const lz4str = new TextDecoder ('utf8') .decode (lz4buf)
  const recovery = JSON.parse (lz4str)

  // ⌥ configurable YAML location, env
  const path = os.homedir() + '/.path'
  if (!fs.existsSync (path)) await fsp.mkdir (path, 0o700)
  // NB: Locally we keep the “tabs” separate from the “items” in “path”,
  // for the sake of having a more readable YAML,
  // but the two should also be compatible and synchronizable (a tab is a kind of path item)

  // ⌥ refactor unpacking into a separate function invocable with “node -e”
  //await fsp.writeFile (path + '/fireforx-recovery.json', JSON.stringify (recovery, null, 2))

  const tabs = await exports.loadTabs()
  let newⁱ = 0, oldʲ = 0
  for (const window of recovery.windows) {
    for (const tab of window.tabs) {
      // Every tab has several history entries
      if (!tab.entries || !tab.entries.length) continue
      const entry = tab.entries[tab.entries.length-1]
      const have = tabs.find (t => t.url == entry.url)
      if (have) {
        ++oldʲ
        have.title = entry.title
      } else {
        ++newⁱ
        tabs.push ({url: entry.url, title: entry.title})}}}

  const lastUpdate = recovery.session.lastUpdate
  assert (lastUpdate > 1618299928626)
  const lastUpdateˢ = date.format (new Date (lastUpdate), 'YYYY-MM-DD HH:mm', false)
  log (`Found “${recoveryᵖ}” from ${lastUpdateˢ} with ${newⁱ} new URLs and ${oldʲ} old`)
  await exports.saveTabs (tabs)

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
