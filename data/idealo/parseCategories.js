
async function parseCategories (data) {
  console.log ('parseCategories, catNum:', data.catNum)
  // <a class="fs-12 link-2 fl-right" href="S-Sitemap/3626.html#3626">243&nbsp;weitere<img src="https://cdn.idealo.com/storage/ipc/pics/buttons/arrow_down.png" style="margin-left:5px; vertical-align:middle;" alt="" width="10" height="10"></a>

  let as = []
  for (const a of document.getElementsByTagName ('a')) {
    if (!a.classList.contains ('fl-right')) continue
    if (!/S-Sitemap\/\d+/ .test (a.href)) continue
    as.push (a)}

  if (data.catNum >= as.length) return {eof: true}
  const a = as[data.catNum]

  console.log ('a', a.href)
  a.click()
  //await new Promise (resolve => setTimeout (resolve, 222))
  return {clicked: true}
}

browser.runtime.onMessage.addListener (
  (data, sender) => {
    console.log ('parseCategories, running listener')
    if (data && data.catNum != null) {
      console.log ('parseCategories, data:', data)
      return new Promise (async resolve => {
        resolve (await parseCategories (data))
      })
    }
    return false
  }
)
