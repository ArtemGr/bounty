function borderify() {
  document.body.style.border = "5px solid red";

  // When we visit “www.idealo.de” for the first time, they show us an iframe
  // “https://cdn.privacy-mgmt.com/index.html?message_id=” and ask to press “Alle akzeptieren”
  const buttons = document.getElementsByTagName ('button')
  for (let ix = 0; ix < buttons.length; ++ix) {
    const button = buttons[ix]
    console.log (JSON.stringify (button.title))
    if (button.title != "Alle akzeptieren") continue
    button.click()
    // Nothing much left to do in this iframe
    return}

}
borderify()


// Proves that we can see the cookies:
//console.log ('borderify; cookie.length =', document.cookie.length)

//console.log ('v 123')
//console.log (document.getElementsByClassName ('channel-preview-context-392Nv'))

// browser.runtime.onMessage.addListener (req => {
//   console.log ('Message from the background script:', req)
//   return Promise.resolve ({response: 'woot!'})})
