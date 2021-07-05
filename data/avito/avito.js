//@ts-check

// https://youtu.be/MJ_akYvnuGY avito 01

// ⌥ manual avito.ru auth ⇒ failed with playwright
// ⌥   switch to puppeteer
// ⌥   try stealth from https://github.com/berstend/puppeteer-extra

const {assert} = require ('console');
const date = require ('date-and-time');
const fs = require ('fs');
const fsp = fs.promises;
const {log, snooze} = require ('log');
const os = require ('os');
const {chromium} = require ('playwright-chromium');
const yaml = require ('yaml');  // https://github.com/eemeli/yaml

// https://github.com/berstend/puppeteer-extra/tree/108a5f2/packages/puppeteer-extra-plugin-stealth#usage
const puppeteer = require ('puppeteer-extra');
const StealthPlugin = require ('puppeteer-extra-plugin-stealth');
puppeteer.use (StealthPlugin())

async function pickChromeDir() {
  const chromeDir = process.env['AVITO_CHROME'] ?? os.homedir() + '/.chrome'
  if (!fs.existsSync (chromeDir)) {await fsp.mkdir (chromeDir, 0o700)}
  await fsp.access (chromeDir)
  return chromeDir}

exports.test = async function() {
  log (`tbd`)}

function help() {
  console.log ('npm i && node avito.js --chats')}

// When invoked from console, “npm i && node avito.js --chats”
// cf. https://nodejs.org/dist/latest-v15.x/docs/api/modules.html#modules_accessing_the_main_module
if (require.main === module) (async () => {
  if (process.argv.includes ('--help')) {help(); return}

  if (process.argv.includes ('--chats')) {
    const chromeDir = await pickChromeDir()
    const headless = (process.env['AVITO_HEADLESS'] ?? '0') == '1' || process.argv.includes ('--headless')

    const args = []
    // Persistent context allows for caching and authentication
    const context = await chromium.launchPersistentContext (chromeDir, {
      headless: headless,
      args: args,
      viewport: {width: 800, height: 700}})

    const page = await context.newPage()

    // Closing the browser when the tab is closed *by the user* allows the program to exit then
    page.on ('close', () => {context.close()})

    // Persistent context comes with a default page, let us discard it
    for (const pageʹ of context.pages()) if (pageʹ != page) await pageʹ.close()

    await page.goto (`https://www.avito.ru/profile/messenger`, {timeout: 66 * 1000})

    return}
})()
