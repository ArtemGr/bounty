const { exec } = require('child_process')
const fs = require('fs')

// TODO: Once in a while gource fails with “unable to open display”,
// this happens under WSL2 and on GitHub Actions
// ( cf. https://github.com/ArtemGr/bounty/runs/1832745746 )
// we should account for that and retry a number of times

const asyncExec = cmd => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      err ? reject(err) : resolve({ output: stderr || stdout, code: 0 })
    })
  })
}

const runGourceCommand = async (fileName, options = { RES_PARAM: '1280x720', LIB_PARAM: 'libx264' }) => {
  try {
    const fileCommand = fs.readFileSync(`./scripts/${fileName}`).toString()
    let cmd = fileCommand

    for (const key in options) {
      cmd = cmd.replace(key, options[key])
    }

    const { output, code } = await asyncExec(cmd)
    return code

  } catch (err) {
    console.log(err);
    console.log(`An error occured on command ${err.cmd}\nExited with status code ${err.code}`)
    return false
  }
}

// TODO: As a user I should be able to specify the script with a command line argument
runGourceCommand('gource')

module.exports = runGourceCommand
