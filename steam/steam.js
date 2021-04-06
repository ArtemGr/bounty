//@ts-check

// ⌥ library mode
// ⌥ save to commented YAML
// ⌥ scrape wishlist
// ⌥ scrape game statistics (“hrs” and “last played”) from https://steamcommunity.com/id/${userId}/
// ⌥ shuffle from YAML

const fs = require ('fs');
const fsp = fs.promises;
const {knuthShuffle} = require ('knuth-shuffle');  // https://stackoverflow.com/a/2450976/257568
const os = require ('os');
const {log, snooze} = require ('log');
const {webkit, Page} = require ('playwright-webkit');

class Game {
  /**
   * @param {string} id
   * @param {string} name
   */
  constructor (id, name) {
    /** @type {string} */
    this.id = id
    /** @type {string} */
    this.name = name}}

exports.Game = Game

async function games (contextDir, headless, userId) {
  const args = []
  // Persistent context allows for caching and authentication
  const context = await webkit.launchPersistentContext (contextDir, {
    headless: headless,
    args: args,
    slowMo: 314,
    viewport: {width: 800, height: 400}})

  const page = await context.newPage()

  // Persistent context comes with a default page, let us discard it
  for (const pageʹ of context.pages()) if (pageʹ != page) await pageʹ.close()

  // Closing the browser when the tab is closed *by the user* allows the program to exit then
  page.on ('close', () => {context.close()})

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
    const id = idˀ[1]

    const _img = `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/capsule_184x69.jpg`

    games.push (new Game (id, name))}

  await context.close()
  return games}

exports.test = function() {
  log ('test')}

function help() {
  console.log ('npm i && node steam.js $STEAM_USERID')}

// When invoked from console, “npm i && node steam.js $STEAM_USERID”
// cf. https://nodejs.org/dist/latest-v15.x/docs/api/modules.html#modules_accessing_the_main_module
if (require.main === module) (async () => {
  if (process.argv.includes ('--help')) {help(); return}

  const contextDir = process.env['STEAM_WEBKIT'] ?? os.homedir() + '/.webkit'
  if (!fs.existsSync (contextDir)) {await fsp.mkdir (contextDir, 0o700)}
  await fsp.access (contextDir)

  const headless = (process.env['STEAM_HEADLESS'] ?? '0') == '1' || process.argv.includes ('--headless')

  let userId = process.env['STEAM_USERID']
  if (userId == null && process.argv && process.argv.length) {
    const last = process.argv[process.argv.length - 1]
    // Make sure we're getting the user ID and not the file name, such as the “steam.js”
    if (/^\w+$/ .test (last)) userId = last}
  if (userId == null) throw new Error ('!STEAM_USERID')

  const gamesᵃ = await games (contextDir, headless, userId)

  const shuffleʹ = process.env['STEAM_SHUFFLE']
  const shuffle = shuffleʹ ? parseInt (shuffleʹ) : (process.argv.includes ('--shuffle') ? 9 : 0)

  if (shuffle) {
    knuthShuffle (gamesᵃ)
    const gamesˢ = gamesᵃ.slice (0, shuffle)
    for (let ix = 0; ix < gamesˢ.length; ++ix) {
      const game = gamesˢ[ix]
      console.log (game.id, game.name)}
  } else {
    for (let ix = 0; ix < gamesᵃ.length; ++ix) {
      const game = gamesᵃ[ix]
      console.log (game.id, game.name)}}
})()
