const { exec } = require('child_process')
const fs = require('fs')

function runGourceCommand(
  fileName,
  options = {
    DISPLAY_PARAM: "':99'",
    RES_PARAM: '1280x720',
    R_PARAM: 25,
    LIB_PARAM: 'libx265',
  },
) {
  const fileCommand = fs.readFileSync(`./scripts/${fileName}`)
  try {
    let cmd = fileCommand.toString()
    for (let key in options) {
      cmd = cmd.replace(key, options[key])
    }
    console.log('Command that is run -->', cmd)

    const script = exec(cmd)
    script.stdout.on('data', function (data) {
      console.log(data.toString())
    })
    script.stderr.on('data', function (data) {
      console.error(data.toString())
    })
    script.on('exit', function (code) {
      console.log('program ended with code: ' + code)
      return code
    })
  } catch (error) {
    console.error(error)
    return false
  }
}

runGourceCommand('gource', {
  DISPLAY_PARAM: "':22'",
  RES_PARAM: '1280x720',
  R_PARAM: 25,
  LIB_PARAM: 'libx265',
})

module.exports = runGourceCommand
