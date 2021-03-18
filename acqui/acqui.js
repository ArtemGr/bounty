//@ts-check

const date = require ('date-and-time');  // https://www.npmjs.com/package/date-and-time
const fs = require ('fs'); const fsp = fs.promises;
const LinkedHashMap = require ('@mootable/hashmap') .LinkedHashMap;
const os = require ('os');
// https://nodejs.org/dist/latest-v15.x/docs/api/readline.html
const readline = require ('readline');
// https://github.com/cronvel/terminal-kit/blob/master/doc/documentation.md
// https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md
const termkit = require ('terminal-kit');
const {log} = require ('log');
const yaml = require ('yaml');  // https://github.com/eemeli/yaml

const HOME = os.homedir()
const iso8601m = date.compile ('YYYY-MM-DDTHH:mm[Z]')

/**
 * @typedef {Object} Note
 * @property {string} item Some human-readable item identifier, provided by user
 * @property {string[]} tags Additions to DP timeline and/or to folksonomy
 * @property {number} [sec] Time of data acquisition, in seconds since UNIX epoch
 * @property {string} tim Time of data acquisition, ISO 8601
 * @property {string} [note] Free-form text note about the `item`
 */

/** @returns {Promise<Note[]>} Loaded from “~/notes.yaml” */
async function loadNotes() {
  // cf. https://stackoverflow.com/questions/14391690/how-to-capture-no-file-for-fs-readfilesync
  let notesˢ
  try {
    notesˢ = await fsp.readFile (HOME + '/notes.yaml', {encoding: 'utf8'})
  } catch (err) {
    if (err.code == 'ENOENT') notesˢ = '[]'
    else throw err}
  if (notesˢ === '') notesˢ = '[]'
  return yaml.parse (notesˢ)}

/** @param {Note[]} notes For “~/notes.yaml” */
async function saveNotes (notes) {
  const notesᵈ = new yaml.Document (notes)

  if (notes.length != 0) {  // Document the database with YAML comments
    const orderᵐ = /** @type {yaml.YAMLMap} */ (notesᵈ.get (0, true))
    orderᵐ.commentBefore = ' Array of notes, updated from acqui.js'
    const comm = (name, comment) => {
      const node = /** @type {yaml.Node} */ (orderᵐ.get (name, true))
      if (node) node.commentBefore = comment}
    comm ('item', ' Some human-readable item identifier, provided by user')
    comm ('tags', ' Additions to DP timeline and/or to folksonomy')
    comm ('tim', ' Time of data acquisition, ISO 8601')
    comm ('sec', ' Time of data acquisition, in seconds since UNIX epoch')}

  const notesᵖ = HOME + '/notes.yaml'
  log (notesᵖ)
  const notesᵗ = notesᵖ + '.' + Date.now() + '.tmp'
  await fsp.writeFile (notesᵗ, notesᵈ.toString())
  await fsp.rename (notesᵗ, notesᵖ)}

/**
 * Adds a note to the YAML array.  
 * We'll likely switch the “timeline” to the notes array later.
 * @param {string} item Some human-readable item identifier, provided by user
 * @param {Set<string>} tags Additions to DP timeline and/or to folksonomy
 * @param {string} [noteˢ] Free-form text note about the `item`
 */
async function fileNote (item, tags, noteˢ) {
  log (`item: ${item}; tags: ${[...tags]}; note: ${noteˢ}`)
  const notes = await loadNotes()

  /** @type {Note} */
  const note = {item: item, tags: [...tags], tim: date.format (new Date(), iso8601m, true)}
  if (typeof noteˢ !== 'undefined') note.note = noteˢ

  notes.push (note)
  await saveNotes (notes)}

(async function() {

  const term = termkit.terminal
  log.out = (line, loc) => {loc && term.gray (loc + '] '); term.gray (line); term ('\n')}

  term.windowTitle ('acquisition')

  log ('Loading timeline…')
  const timelineᵖ = fs.existsSync (HOME + '/timeline') ? HOME + '/timeline' : HOME + '/Downloads/timeline';
  const timeline = await fsp.readFile (timelineᵖ, {encoding: 'utf8'})
  let ca, re = /(20\d{12}):\s(\[[\w,]+\]\s)?(.*?)(?=\n20\d{12}|\n$|$)/g, caᵃ = []
  while (ca = re.exec (timeline)) caᵃ.push (ca[3])
  // If we have an item “foo” at the beginning and at the end of the timeline
  // the linked map will only remember the beginning position and not the end one (FIFO),
  // hence to order the hints by recency we should reverse them before deduplication
  caᵃ.reverse()
  const items = new LinkedHashMap(), itemsᵃ = /** @type {string[]} */ ([])
  for (const item of caᵃ) items.set (item, 0)
  for (const [key, _val] of items) itemsᵃ.push (key)

  term ('> ')  // PS2
  // https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md#ref.inputField
  let line = await term.inputField ({
    cancelable: true,
    history: itemsᵃ,  // For UP and DOWN
    autoComplete: itemsᵃ,
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
  line = line.trim()
  if (line === '') {term.processExit (0); return}

  const tags = new Set()
  for (;;) {
    term ('\n> ')
    const tagsʰ = [
      'fireworks', 'entropy', 'orientation', 'wellness',  // DP
      'family',
      'mv',
      'note']
    const tag = await term.inputField ({
      cancelable: true,
      history: tagsʰ,  // For UP and DOWN
      autoComplete: tagsʰ,
      autoCompleteHint: true,
      autoCompleteMenu: true,  // By TAB
    }).promise
    if (typeof tag == 'undefined') {term.processExit (0); return}
    if (tag == '') break
    // The “notes” tag separates the DP tracking of activities from the generic data acquisition
    if (tag == 'note') {
      // Tried to use the “readline” there instead of the “inputField” to see whether it'll
      // allow for swipe keyboard under Termux. It does not.
      // But we can swipe left on the extra buttons in order to switch to the
      // [“Text Input View”](https://wiki.termux.com/wiki/Touch_Keyboard)
      const rl = readline.createInterface ({input: process.stdin, output: process.stdout})
      const question = new Promise (resolve => rl.question ('Enter the note line below:\n', resolve))
      let note = await question
      note = note.trim()
      if (note === '') {term.processExit (0); return}
      await fileNote (line, tags, note)
      rl.close()
      term.processExit (0); return
    }
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
