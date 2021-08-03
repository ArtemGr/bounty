//@ts-check

/// <reference types="web-ext-types" />

/** @type {browser.tabs} */
const tabs = browser.tabs

tabs.query ({}) .then (async (tabsʹ) => {
  //for (const tab of tabs) browser.pageAction.show (tab.id)

  // If we are on “www.idealo.de” then go to the page with categories
  for (const tab of tabsʹ) {
    if (!tab.active) continue
    if (tab.url == 'https://www.idealo.de/') {
      // https://stackoverflow.com/a/1894953/257568
      console.log ('opening categories..')
      const tabʹ = await tabs.update (tab.id, {url: 'https://www.idealo.de/preisvergleich/Sitemap.html'})
      console.log ('tabʹ', tabʹ)
    }
  }

})

tabs.onUpdated.addListener ((id, changeInfo, tab) => {
  //browser.pageAction.show (tab.id)
})
