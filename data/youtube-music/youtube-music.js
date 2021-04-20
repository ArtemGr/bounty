//@ts-check

const {assert} = require ('console');
const date = require ('date-and-time');
const fs = require ('fs');
const fsp = fs.promises;
const {knuthShuffle} = require ('knuth-shuffle');  // https://stackoverflow.com/a/2450976/257568
const {log, snooze} = require ('log');
const os = require ('os');
// NB: As of 2021-04 YouTube Music doesn't want to work with WebKit
const {chromium} = require ('playwright-chromium');
const yaml = require ('yaml');  // https://github.com/eemeli/yaml

/**
 * @typedef {Object} Track
 * @property {string} id As seen in share URL, “https://music.youtube.com/watch?v=$id”
 * @property {string} title (Might be different from file “name”)
 * @property {string} author
 * @property {string} authorChan As in “https://music.youtube.com/channel/$authorChan”
 * @property {string} album
 * @property {string} albumChan As in “https://music.youtube.com/channel/$albumChan”
 */

/** @returns {Promise<Track[]>} Loaded from “~/.path/ym-tracks.yaml” */
exports.loadTracks = async function() {
  // cf. https://stackoverflow.com/questions/14391690/how-to-capture-no-file-for-fs-readfilesync
  let tracksˢ
  try {
    tracksˢ = await fsp.readFile (os.homedir() + '/.path/ym-tracks.yaml', {encoding: 'utf8'})
  } catch (err) {
    if (err.code == 'ENOENT') tracksˢ = '[]'
    else throw err}
  if (tracksˢ === '') tracksˢ = '[]'
  return yaml.parse (tracksˢ)}

/** @param {Track[]} tracks For “~/.path/ym-tracks.yaml” */
exports.saveTracks = async function (tracks) {
  const tracksᵈ = new yaml.Document (tracks)

  if (tracks.length != 0) {  // Document the database with YAML comments
    const trackᵐ = /** @type {yaml.YAMLMap} */ (tracksᵈ.get (0, true))
    trackᵐ.commentBefore = ' Tracks loaded from YouTube Music playlist'
    const comm = (name, comment) => {
      const node = /** @type {yaml.Node} */ (trackᵐ.get (name, true))
      if (node) node.commentBefore = comment}
    comm ('id', ' As seen in share URL, “https://music.youtube.com/watch?v=$id”')
    comm ('authorChan', ' As in “https://music.youtube.com/channel/$authorChan”')
    comm ('albumChan', ' As in “https://music.youtube.com/channel/$albumChan”')}

  const tracksᵖ = os.homedir() + '/.path/ym-tracks.yaml'
  const tracksᵗ = tracksᵖ + '.' + Date.now() + '.tmp'
  await fsp.writeFile (tracksᵗ, tracksᵈ.toString())
  await fsp.rename (tracksᵗ, tracksᵖ)}

async function pickChromeDir() {
  const chromeDir = process.env['YM_CHROME'] ?? os.homedir() + '/.chrome'
  if (!fs.existsSync (chromeDir)) {await fsp.mkdir (chromeDir, 0o700)}
  await fsp.access (chromeDir)
  return chromeDir}

/**
 * @param {string} chromeDir For browser cache and cookies
 * @param {boolean} headless Whether to hide the browser window
 * @param {string} list Play list ID, as in “https://music.youtube.com/playlist?list=$list”
 * @returns {Promise<Track[]>}
 */
exports.tracks = async function (chromeDir, headless, list) {
  const args = []
  args.push ('--user-agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.50 Safari/537.36"')
  // Persistent context allows for caching and authentication
  const context = await chromium.launchPersistentContext (chromeDir, {
    headless: headless,
    args: args,
    viewport: {width: 800, height: 400}})

  const page = await context.newPage()

  // Closing the browser when the tab is closed *by the user* allows the program to exit then
  page.on ('close', () => {context.close()})

  // Persistent context comes with a default page, let us discard it
  for (const pageʹ of context.pages()) if (pageʹ != page) await pageʹ.close()

  await page.goto (`https://music.youtube.com/playlist?list=${list}`, {timeout: 66 * 1000})

  // ⌥ handle or help with initial lack of authentication
  // cf. https://www.reddit.com/r/node/comments/gw0chw/gmail_login_using_puppeteer/fsslbyt ?

  // NB: We can not sign in, says “This browser or app may not be secure”,
  // but public playlists should be available NP
  // cf. https://github.com/microsoft/playwright/issues/1168

  // Find the number of songs in the playlist
  const sepˀ = 'yt-formatted-string.ytmusic-detail-header-renderer>span:text-is("•")'
  await page.waitForSelector (sepˀ)
  const seps = await page.$$ (sepˀ)
  assert (seps.length == 3, seps.length)
  const nsongsˢ = await seps[2].evaluate (node => node.parentElement.firstChild.textContent)
  const nsongsᶜ = /^(\d+) songs$/ .exec (nsongsˢ)
  assert (nsongsᶜ, nsongsˢ)
  const nsongs = parseInt (nsongsᶜ[1])
  if (!nsongs) return []

  // Scroll down until we get `nsongs` of `rows`

  let rows = []
  while (!rows.length || rows.length < nsongs - 1) {
    await snooze (31)
    rows = await page.$$ ('yt-formatted-string[title]>a[href*="/watch?v="]')
    if (rows.length) await rows[rows.length-1].scrollIntoViewIfNeeded()}

  // Find titles and IDs

  const titles = /** @type string[]} */ ([]), ids = []
  for (const row of rows) {
    const href = await (await row.getProperty ('href')) .jsonValue()
    const title = await row.evaluate (node => node.parentElement.title)
    const hrefᶜ = /\/watch\?v=([\w-]+)/ .exec (href)
    assert (hrefᶜ, href)
    ids.push (hrefᶜ[1])
    titles.push (title)}

  // Find authors and albums

  const channels = await page.$$ ('yt-formatted-string[title]>a[href*="/channel/"]')
  assert (channels.length == rows.length * 2, `${channels.length}, ${rows.length}`)

  const tracks = []
  for (let ix = 0; ix < rows.length; ++ix) {
    const authorⁿ = channels [ix * 2]
    const authorʰ = await (await authorⁿ.getProperty ('href')) .jsonValue()
    const authorᵗ = await authorⁿ.evaluate (node => node.parentElement.title)
    const authorᶜ = /\/channel\/([\w-]+)/ .exec (authorʰ)

    const albumⁿ = channels [ix * 2 + 1]
    const albumʰ = await (await albumⁿ.getProperty ('href')) .jsonValue()
    const albumᵗ = await albumⁿ.evaluate (node => node.parentElement.title)
    const albumᶜ = /\/channel\/([\w-]+)/ .exec (albumʰ)

    tracks.push ({
      id: ids[ix],
      title: titles[ix],
      author: authorᵗ,
      authorChan: authorᶜ[1],
      album: albumᵗ,
      albumChan: albumᶜ[1]})}

  await page.close()
  await context.close()
  return tracks}

exports.test = async function() {
  const chromeDir = await pickChromeDir();
  const tracks = await exports.tracks (chromeDir, true, 'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG')
  assert (50 <= tracks.length && tracks.length <= 150)
  log (`${tracks.length} tracks`)}

function help() {
  console.log ('npm i && node youtube-music.js --tracks')}

// When invoked from console, “npm i && node youtube-music.js --tracks”
// cf. https://nodejs.org/dist/latest-v15.x/docs/api/modules.html#modules_accessing_the_main_module
if (require.main === module) (async () => {
  if (process.argv.includes ('--help')) {help(); return}

  if (process.argv.includes ('--tracks')) {
    const chromeDir = await pickChromeDir()
    const headless = (process.env['YM_HEADLESS'] ?? '0') == '1' || process.argv.includes ('--headless')

    let list = process.env['YM_LIST']
    if (list == null && process.argv && process.argv.length) {
      const last = process.argv[process.argv.length - 1]
      // Make sure we're getting the list ID and not the file name, such as the “steam.js”
      if (/^[\w-]+$/ .test (last) && !/^--/ .test (last)) list = last}
    if (list == null) throw new Error ('!YM_LIST')

    const tracks = await exports.tracks (chromeDir, headless, list)
    await exports.saveTracks (tracks)
    log (`${tracks.length} tracks`)
    return}
})()
