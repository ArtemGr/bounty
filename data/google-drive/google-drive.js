//@ts-check

const {spawnSync} = require ('child_process');
const clipboardy = require ('clipboardy');
const {assert} = require ('console');
const fs = require ('fs'); const fsp = fs.promises;
const {google} = require ('googleapis');  // https://www.npmjs.com/package/googleapis
const {log, snooze} = require ('log');
// https://github.com/cronvel/terminal-kit/blob/master/doc/documentation.md
// https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md
const termkit = require ('terminal-kit');

/** @typedef {import('google-auth-library').Credentials} Credentials */

const win = process.platform == 'win32'

async function findSecret() {
  const files = await fsp.readdir ('.')
  return files.find (f => /^client_secret.*\.json$/ .test (f))}

async function secret2oauth() {
  const secretⁿ = await findSecret()
  if (!secretⁿ) throw new Error ('No client_secret*.json')
  const secretˢ = await fsp.readFile (secretⁿ, {encoding: 'utf8'})
  const secret = JSON.parse (secretˢ)
  if (!secret.installed) throw new Error ('No “installed” in client_secret')
  const i = secret.installed
  if (!i.client_id) throw new Error ('No “installed.client_id” in client_secret')
  if (!i.client_secret) throw new Error ('No “installed.client_secret in client_secret')
  if (!i.redirect_uris) throw new Error ('No “installed.redirect_uris in client_secret')
  // https://github.com/googleapis/google-api-nodejs-client#generating-an-authentication-url
  const oauth2 = new google.auth.OAuth2 (i.client_id, i.client_secret, i.redirect_uris[0])
  return oauth2}

const timeline = fs.createReadStream ('c:/spool/synced/iPhone/timeline.webm')

async function scope2token (oauth2, scope, file) {
  if (fs.existsSync (file)) {
    const tokenˢ = await fsp.readFile (file, {encoding: 'utf8'})
    /** @type {Credentials} */
    const tokenʲ = JSON.parse (tokenˢ)
    oauth2.credentials = tokenʲ
  } else {
    const authUrl = oauth2.generateAuthUrl ({
      access_type: 'offline',
      // https://developers.google.com/drive/api/v3/about-auth
      scope: scope,
      prompt: 'consent'})

    if (win) {
      log (`Opening\n${authUrl}`)
      await fsp.writeFile ('auth.url', `[InternetShortcut]\nURL=${authUrl}\n`)
      // NB: Better than “open”: as of 2021-04 the latter closes the command window
      spawnSync ('explorer.exe', ['auth.url'])
    } else {
      log (`Open\n${authUrl}`)}

    let clipboardₒ = await clipboardy.read()
    let input = null
    const term = termkit.terminal
    term.brightWhite ('Copy the code into clipboard, or enter here:\n')
    const ie = term.inputField ((err, text) => {
      if (err) throw new Error (err)
      console.log ('')  // CRLF
      input = text.trim()})
    let token = null
    while (input == null) {
      await snooze (31)
      const clipboard = (await clipboardy.read()) .trim()
      if (clipboard == clipboardₒ) continue
      clipboardₒ = clipboard
      log (clipboard)
      try {  // See if something we've got from clipboard works as the code
        token = await oauth2.getToken (clipboard)
        ie.abort()
        break
      } catch (ex) {log (ex)}}
    if (token == null && input != null) token = await oauth2.getToken (input)
    log (token.tokens)
    assert (token.tokens.scope == scope)

    await fsp.rm ('auth.url')
    await fsp.writeFile (file, JSON.stringify (token.tokens))
    oauth2.credentials = token.tokens}}

/** Demonstrate creating a Google Drive file */
async function pocCreate() {
  // See “step one: get secret” in “README.md” for how to obtain client_secret*.json
  const oauth2 = await secret2oauth()

  // First we need the full “https://www.googleapis.com/auth/drive” scope
  // to create the file from the app,
  // then later the limited “drive.file” scope should work for updates

  await scope2token (oauth2, 'https://www.googleapis.com/auth/drive', 'full-token.json')
  const drive = google.drive ({version: 'v3', auth: oauth2})

  // https://developers.google.com/drive/api/v3/reference/files/list
  const have = await drive.files.list ({
    // https://developers.google.com/drive/api/v3/search-files
    q: "name='timeline.mp4'"})
  for (const file of have.data.files) {
    log (`Removing a previous copy, ${file.id}..`)
    // https://developers.google.com/drive/api/v3/reference/files/delete
    await drive.files.delete ({fileId: file.id})}

  log ('Uploading timeline..')

  // https://github.com/googleapis/google-api-nodejs-client#media-uploads
  // https://developers.google.com/drive/api/v3/reference/comments/create
  const rc = await drive.files.create ({
    requestBody: {
      name: 'timeline.mp4',
      description: 'Full Gource timeline',
      mimeType: 'video/webm'},
    media: {
      mimeType: 'video/webm',
      body: timeline},
    // https://developers.google.com/drive/api/v3/fields-parameter
    fields: 'id, webViewLink'})

  const fid = rc.data.id

  await drive.permissions.create ({
    requestBody: {
      role: 'reader',
      type: 'anyone'},
    fileId: fid})

  // ⌥ save the file ID for `pocUpdate`

  log (fid)
  log (`https://drive.google.com/uc?id=${fid}`)  // Direct video stream
  log (rc.data.webViewLink)}

/** Demonstrate updating a Google Drive file with but the minimal “drive.file” token */
async function pocUpdate() {
  const oauth2 = await secret2oauth()
  await scope2token (oauth2, 'https://www.googleapis.com/auth/drive.file', 'drive-file-token.json')
  const drive = google.drive ({version: 'v3', auth: oauth2})

  const have = await drive.files.list ({
    q: "name='timeline.mp4'"})
  assert (have.data.files.length)
  const fid = have.data.files[0].id

  // https://developers.google.com/drive/api/v3/reference/comments/update
  const rc = await drive.files.update ({
    fileId: fid,
    media: {
      mimeType: 'video/webm',
      body: timeline},
    fields: 'webViewLink'})

  log (fid)
  log (`https://drive.google.com/uc?id=${fid}`)  // Direct video stream
  log (rc.data.webViewLink)

  process.exit (0)}

async function clean() {
  const rm = async name => {if (name && fs.existsSync (name)) await fsp.rm (name)}
  await rm ('full-token.json')
  await rm ('auth.url')
  await rm (await findSecret())}

function help() {
  console.log ('npm i && node google-drive.js')
  console.log ('  --create  ..  Create a Google Drive file')
  console.log ('  --update  ..  Update a created Google Drive file')
  console.log ('  --clean   ..  Remove secret and token files')}

// When invoked from console, “npm i && node steam.js $STEAM_USERID”
// cf. https://nodejs.org/dist/latest-v15.x/docs/api/modules.html#modules_accessing_the_main_module
if (require.main === module) (async () => {
  if (process.argv.includes ('--help')) {help(); return}
  if (process.argv.includes ('--clean')) {await clean(); return}
  if (process.argv.includes ('--create')) {await pocCreate(); return}
  if (process.argv.includes ('--update')) {await pocUpdate(); return}
})()
