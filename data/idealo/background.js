
browser.tabs.query ({}) .then ((tabs) => {
  for (const tab of tabs) browser.pageAction.show (tab.id)})

browser.tabs.onUpdated.addListener ((id, changeInfo, tab) => {
  browser.pageAction.show (tab.id)})
