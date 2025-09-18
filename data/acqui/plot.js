//@ts-check

const {spawn} = require ('child_process');

if (require.main === module) (async function() {

  const plot = Math.floor (Math.random() * 1462) + 1
  const url = `https://garykac.github.io/plotto/plotto-mf.html#${plot}`
  console.log (url)

  spawn ('C:/Program Files/Firefox Developer Edition/firefox.exe', [url], {detached: true, stdio: 'ignore'})

}())
