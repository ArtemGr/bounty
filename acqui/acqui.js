//@ts-check

// https://github.com/cronvel/terminal-kit/blob/master/doc/documentation.md
// https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md
const termkit = require ('terminal-kit');
const {log} = require ('log');

(async function() {

  log ('hi')

  const term = termkit.terminal
  term ('> ')  // PS2
  // https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md#ref.inputField
  const qwe = await term.inputField ({
    autoComplete: ['qwe', 'asd', 'zxc'],
    autoCompleteHint: true,
    autoCompleteMenu: true
  }).promise

  term ('fin')
  term.processExit (0)

}())
