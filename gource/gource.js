const { exec } = require('child_process')

// This file can be changed according to user's convinience
const scripts = require('./scripts.json')

function gource(
  scriptFile,
  options = {
    DISPLAY: 99,
  }
) {
  try {
    const script_ = scripts[scriptFile]
    const shell_script = eval(script_) // here options is used with the ` operator
    const script = exec(shell_script)

    script.stdout.on('data', function (data) {
      console.log(data.toString())
      return 0
    })
    script.stderr.on('data', function (data) {
      console.error(data.toString())
      return false
    })
    script.on('exit', function (code) {
      console.log('program ended with code: ' + code)
      return code
    })
  } catch (err) {
    console.error(err)
    return false
  }
}

gource('second', {
  DISPLAY: 10,
})
module.exports = gource
