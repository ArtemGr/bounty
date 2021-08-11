//@ts-check
/// <reference types="web-ext-types" />

/** @type {browser.tabs} */
const tabs = browser.tabs

async function parseCategories (/** @type {browser.tabs.Tab} */ tab) {
  const msg = {foobar: 123}
  const js = /** @type {any} */ (await browser.runtime.sendNativeMessage ('ext_driver', msg))
  if (js.err) console.error (js.err); else console.info ('ext_driver]', js)
  return

  for (let catNum = 0; catNum < 99; ++catNum) {
    console.log ('running script')
    await tabs.executeScript (tab.id, {file: 'parseCategories.js'})
    await new Promise (resolve => setTimeout (resolve, 3333))
    console.log ('waiting for reply')
    const reply = await browser.tabs.sendMessage (tab.id, {catNum})
    console.log ('reply', reply)
    if (reply && reply['eof']) break
    await new Promise (resolve => setTimeout (resolve, 3333))
  }
}

tabs.query ({}) .then (async (tabsʹ) => {
  //for (const tab of tabs) browser.pageAction.show (tab.id)

  // If we are on “www.idealo.de” then go to the page with categories
  for (const tab of tabsʹ) {
    if (tab.url == 'https://www.idealo.de/') {
      // https://stackoverflow.com/a/1894953/257568
      console.log ('opening categories..')
      // ⌥ consider clicking on “<a  class="i-navigation-link” to get to the Sitemap
      await tabs.update (tab.id, {url: 'https://www.idealo.de/preisvergleich/Sitemap.html'})
      await parseCategories (tab)}

    if (tab.url == 'https://www.idealo.de/preisvergleich/Sitemap.html') {
      await parseCategories (tab)}

    if (new RegExp ('^https://www.idealo.de/preisvergleich/S-Sitemap/\\d+\\.html#\\d+') .test (tab.url)) {
      await parseCategories (tab)}

}})

tabs.onUpdated.addListener ((id, changeInfo, tab) => {
  //browser.pageAction.show (tab.id)
  })
