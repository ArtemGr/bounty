//@ts-check

const date = require('date-and-time');  // https://www.npmjs.com/package/date-and-time
const fs = require ('fs'); const fsp = fs.promises;
const os = require ('os');
// https://github.com/cronvel/terminal-kit/blob/master/doc/documentation.md
// https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md
const termkit = require ('terminal-kit');
const {log} = require ('log');

(async function() {

  const term = termkit.terminal
  log.out = (line, loc) => {loc && term.gray (loc + '] '); term.gray (line); term ('\n')}

  log ('Loading timeline…')
  const home = os.homedir()
  const timelineᵖ = fs.existsSync (home + '/timeline') ? home + '/timeline' : home + '/Downloads/timeline';
  const timeline = await fsp.readFile (timelineᵖ, {encoding: 'utf8'})
  let ca, re = /(20\d{12}):\s(\[[\w,]+\]\s)?(.*?)(?=\n20\d{12}|\n$|$)/g, lines = new Set()
  while (ca = re.exec (timeline)) lines.add (ca[3])

  term ('> ')  // PS2
  // https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md#ref.inputField
  const line = await term.inputField ({
    cancelable: true,
    history: [...lines],  // For UP and DOWN
    autoComplete: [...lines],
    autoCompleteHint: true,
    // What we had in mind is `singleColumnMenu` appearing preemptively,
    // with elements to be picked through the use of some special shortcuts,
    // but that doesn't come out of the box with `inputField`
    autoCompleteMenu: true,  // By TAB
    tokenHook: (tok, end, prev, term, conf) => {
      // Should check whether the `tok` is known and display the going information if it is
    }
  }).promise

  if (typeof line == 'undefined') {term.processExit (0); return}

  const tags = new Set()
  for (;;) {
    term ('\n> ')
    const tagsʰ = ['fireworks', 'entropy', 'orientation', 'wellness', 'family', 'mv']
    const tag = await term.inputField ({
      cancelable: true,
      history: tagsʰ,  // For UP and DOWN
      autoComplete: tagsʰ,
      autoCompleteHint: true,
      autoCompleteMenu: true,  // By TAB
    }).promise
    if (typeof tag == 'undefined') {term.processExit (0); return}
    if (tag == '') break
    tags.add (tag)
  }

  term.column (1) .eraseLine()

  log (`Saving to “${timelineᵖ}”…`)
  let tll = date.format (new Date(), 'YYYYMMDDHHmmss') + ':'
  if (tags) tll += ' [' + [...tags].join (',') + ']'
  tll += ' ' + line + '\n'
  await fsp.appendFile (timelineᵖ, tll, {encoding: 'utf8'})
  term.processExit (0)

}())
