//@ts-check

// ⌥ pick a random game
// ⌥ command line help
// ⌥ get the steam id from the command line
// ⌥ headless option
// ⌥ call a function from package.json script test
// ⌥ library mode
// ⌥ save to commented YAML
// ⌥ scrape wishlist
// ⌥ scrape game statistics (“hrs” and “last played”) from https://steamcommunity.com/id/artemciy/

const fs = require ('fs');
const fsp = fs.promises;
const os = require ('os');
const {log, snooze} = require ('log');
const {webkit, Page} = require ('playwright-webkit');

(async () => {
  const home = os.homedir()
  const contextDir = home + '/.webkit'
  if (!fs.existsSync (contextDir)) {await fsp.mkdir (contextDir, 0o700)}
  await fsp.access (contextDir)

  const args = []
  // Persistent context allows for caching and authentication
  const context = await webkit.launchPersistentContext (contextDir, {
    headless: false,
    args: args,
    slowMo: 314,
    viewport: {width: 800, height: 400}})

  const page = await context.newPage()

  // Persistent context comes with a default page, let us discard it
  for (const pageʹ of context.pages()) if (pageʹ != page) await pageʹ.close()

  // Closing the browser when the tab is closed *by the user* allows the program to exit then
  page.on ('close', () => {log ('page closed'); context.close()})

  await page.goto ('https://steamcommunity.com/id/artemciy/games/?tab=all', {timeout: 99 * 1000})

  await page.waitForSelector ('div#gameslist_sort_options')  // Check head
  await page.waitForSelector ('div#footer', {state: 'attached'})  // Check tail

  const rows = await page.$$ ('div.gameListRow')
  for (let ix = 0; ix < rows.length; ++ix) {
    const row = rows[ix]
    const nameʹ = await row.$ ('div.gameListRowItemName')
    const name = await nameʹ.textContent()

    const idʹ = await (await row.getProperty ('id')) .jsonValue()
    const idˀ = /game_(\d+)/ .exec (idʹ)
    if (!idˀ || idˀ.length != 2) throw new Error (`!id: ${idʹ}`)
    const id = idˀ[1]

    const img = `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/capsule_184x69.jpg`

    log (`${id}, ${name}`)}

  await context.close()})()
