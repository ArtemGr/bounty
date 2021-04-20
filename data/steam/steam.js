//@ts-check

// ⌥ save to commented YAML
// ⌥ scrape wishlist
// ⌥ scrape game statistics (“hrs” and “last played”) from https://steamcommunity.com/id/${userId}/
// ⌥ shuffle from YAML
// ⌥ look at https://github.com/waylonflinn/steam-community
// ⌥ the option to visit a game page and grab the “11.8 hrs on record” there?
// ⌥ track when a game has first appeared in the list and when it was removed (if it was)

const {assert} = require ('console');
const fs = require ('fs');
const fsp = fs.promises;
const {knuthShuffle} = require ('knuth-shuffle');  // https://stackoverflow.com/a/2450976/257568
const os = require ('os');
const {log, snooze} = require ('log');
const {webkit, Page} = require ('playwright-webkit');

class Game {
  /**
   * @param {number} id
   * @param {string} name
   */
  constructor (id, name) {
    /** @type {number} */
    this.id = id
    /** @type {string} */
    this.name = name}}

exports.Game = Game

/**
 * @param {string} webkitDir For browser cache and cookies
 * @param {boolean} headless Whether to hide the browser window
 * @param {string} userId The "bar" in "https://steamcommunity.com/id/bar/"
 * @returns {Promise<Game[]>} Games listed at "https://steamcommunity.com/id/${userId}/games/?tab=all"
 */
exports.games = async function (webkitDir, headless, userId) {
  const args = []
  // Persistent context allows for caching and authentication
  const context = await webkit.launchPersistentContext (webkitDir, {
    headless: headless,
    args: args,
    slowMo: headless ? 0 : 314,
    viewport: {width: 800, height: 400}})

  const page = await context.newPage()

  // Closing the browser when the tab is closed *by the user* allows the program to exit then
  page.on ('close', () => {context.close()})

  // Persistent context comes with a default page, let us discard it
  for (const pageʹ of context.pages()) if (pageʹ != page) await pageʹ.close()

  await page.goto (`https://steamcommunity.com/id/${userId}/games/?tab=all`, {timeout: 99 * 1000})

  await page.waitForSelector ('div#gameslist_sort_options')  // Check head
  await page.waitForSelector ('div#footer', {state: 'attached'})  // Check tail

  const rows = await page.$$ ('div.gameListRow')
  const games = []
  for (let ix = 0; ix < rows.length; ++ix) {
    const row = rows[ix]
    const nameʹ = await row.$ ('div.gameListRowItemName')
    const name = await nameʹ.textContent()

    const idʹ = await (await row.getProperty ('id')) .jsonValue()
    const idˀ = /game_(\d+)/ .exec (idʹ)
    if (!idˀ || idˀ.length != 2) throw new Error (`!id: ${idʹ}`)
    const id = parseInt (idˀ[1])

    const _img = `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/capsule_184x69.jpg`

    games.push (new Game (id, name))}

  await context.close()
  return games}

async function pickWebkitDir() {
  const webkitDir = process.env['STEAM_WEBKIT'] ?? os.homedir() + '/.webkit'
  if (!fs.existsSync (webkitDir)) {await fsp.mkdir (webkitDir, 0o700)}
  await fsp.access (webkitDir)
  return webkitDir}

/**
 * @returns {Promise<Game[]>} Games listed locally in “steamapps”
 */
exports.installed = async function() {
  const steamapps = '/Program Files (x86)/Steam/steamapps'
  const files = await fsp.readdir (steamapps)
  const games = []
  for (const fname of files) {
    const fnameˀ = /^appmanifest_(\d+).acf$/ .exec (fname)
    if (!fnameˀ || !fnameˀ[1]) continue
    const id = parseInt (fnameˀ[1])
    const manifest = await fsp.readFile (`${steamapps}/${fname}`, {encoding: 'utf8'})
    const magic = /^"AppState"\s(.*)$/s .exec (manifest)
    if (!magic || !magic[1]) continue
    const manifestʹ = magic[1]
    const appidˀ = /"appid"\s+"(\d+)"/ .exec (manifestʹ)
    assert (appidˀ && parseInt (appidˀ[1]) == id)
    // Not sure how the double-quotes are escaped here
    // One option is to `JSON.parse` everything to the right of the "name"
    const nameˀ = /"name"\s+"([^"]+)"/ .exec (manifestʹ)
    if (!nameˀ) continue
    const name = nameˀ[1]
    games.push (new Game (id, name))}
  return games}

exports.test = async function() {
  const webkitDir = await pickWebkitDir();
  const games = await exports.games (webkitDir, true, 'bar')
  const braid = games.find (g => g.name == 'Braid')
  assert (braid && braid.id == 26800)
  log (`${games.length} games, Braid is ${braid.id}`)

  const installed = await exports.installed()
  log (`${installed.length} installed`)}

function help() {
  console.log ('npm i && node steam.js [--shuffle] $STEAM_USERID')
  console.log ('node steam.js [--shuffle] --installed')}

// When invoked from console, “npm i && node steam.js $STEAM_USERID”
// cf. https://nodejs.org/dist/latest-v15.x/docs/api/modules.html#modules_accessing_the_main_module
if (require.main === module) (async () => {
  if (process.argv.includes ('--help')) {help(); return}

  const shuffleʹ = process.env['STEAM_SHUFFLE']
  const shuffle = shuffleʹ ? parseInt (shuffleʹ) : (process.argv.includes ('--shuffle') ? 9 : 0)

  if (process.argv.includes ('--installed')) {
    let games = await exports.installed()
    if (shuffle) {knuthShuffle (games); games = games.slice (0, shuffle)}
    for (const game of games) {console.log (game.id, game.name)}
    return}

  const webkitDir = await pickWebkitDir()
  const headless = (process.env['STEAM_HEADLESS'] ?? '0') == '1' || process.argv.includes ('--headless')

  let userId = process.env['STEAM_USERID']
  if (userId == null && process.argv && process.argv.length) {
    const last = process.argv[process.argv.length - 1]
    // Make sure we're getting the user ID and not the file name, such as the “steam.js”
    if (/^\w+$/ .test (last)) userId = last}
  if (userId == null) throw new Error ('!STEAM_USERID')

  const games = await exports.games (webkitDir, headless, userId)

  if (shuffle) {
    knuthShuffle (games)
    const gamesˢ = games.slice (0, shuffle)
    for (let ix = 0; ix < gamesˢ.length; ++ix) {
      const game = gamesˢ[ix]
      console.log (game.id, game.name)}
  } else {
    for (let ix = 0; ix < games.length; ++ix) {
      const game = games[ix]
      console.log (game.id, game.name)}}
})()
