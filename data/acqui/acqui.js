//@ts-check

const {spawn} = require ('child_process');
const date = require ('date-and-time');  // https://www.npmjs.com/package/date-and-time
const fs = require ('fs'); const fsp = fs.promises;
const os = require ('os');
// https://nodejs.org/dist/latest-v15.x/docs/api/readline.html
const readline = require ('readline');
// https://github.com/cronvel/terminal-kit/blob/master/doc/documentation.md
// https://github.com/cronvel/terminal-kit/blob/master/doc/high-level.md
const termkit = require ('terminal-kit');
const {assert, log} = require ('llog');
const yaml = require ('yaml');  // https://github.com/eemeli/yaml

const HOME = os.homedir()
const ACQUI_DB = process.env['ACQUI_DB']
const iso8601m = date.compile ('YYYY-MM-DDTHH:mm[Z]')
const YMDHMS = date.compile ('YYYYMMDDHHmmss')
const win = process.platform == 'win32'
const DIRECTIONS = ['fireworks', 'entropy', 'orientation', 'wellness']

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
    notesˢ = await fsp.readFile (ACQUI_DB + '/notes.yaml', {encoding: 'utf8'})
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

  const notesᵖ = ACQUI_DB + '/notes.yaml'
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

async function readNote (term, line, tags) {
  const rl = readline.createInterface ({input: process.stdin, output: process.stdout})
  const question = new Promise (resolve => rl.question ('Enter the note line below:\n', resolve))
  let note = await question
  note = note.trim()
  if (note === '') {term.processExit (0); return}
  await fileNote (line, tags, note)
  rl.close()
  term.processExit (0)}

// When invoked from console
// cf. https://nodejs.org/dist/latest-v15.x/docs/api/modules.html#modules_accessing_the_main_module
if (require.main === module) (async function() {

  const term = termkit.terminal
  log.out = (line, loc) => {loc && term.gray (loc + '] '); term.gray (line); term ('\n')}

  term.windowTitle ('acquisition')

  log ('Loading timeline…')
  if (!ACQUI_DB) throw new Error ('!ACQUI_DB')
  if (!(await fsp.stat (ACQUI_DB)).isDirectory()) throw new Error ('ACQUI_DB !dir')
  const timelineᵖ = ACQUI_DB + '/timeline';
  const timeline = await fsp.readFile (timelineᵖ, {encoding: 'utf8'})
  const dp = /** @type {Map<string, number>} */ (new Map())
  let lastPoint = /** @type {Date} */ (null)
  let ca, re = /(20\d{12}):\s(\[[\w,\ \.]+\]\s)?(.*?)(?=\n20\d{12}|\n$|$)/g, caᵃ = []
  while (ca = re.exec (timeline)) {
    caᵃ.push (ca[3])

    const tim = date.parse (ca[1], YMDHMS, true)
    assert (tim != null)

    // Parse the tags to calculate the direction points
    if (ca[2] == null) continue  // No tags
    const tagsʹ = /^\[(.*)\]\s?$/ .exec (ca[2])
    assert (tagsʹ != null)
    const tagsʺ = tagsʹ[1].split (/\,\s*/)
    assert (tagsʺ.length != 0)

    const tagsˆ = /** @type {[String, number][]} */ ([])
    for (const tagⁱ of tagsʺ) {
      const [tag, pointsˢ] = tagⁱ.split (/\s+/)
      let points = 0.01
      if (pointsˢ != null) {
        assert (/^[\d\.]+$/ .test (pointsˢ))  // A number
        points = parseFloat (pointsˢ)
        assert (!isNaN (points))}

      if (!DIRECTIONS.find (v => v == tag)) continue  // Not a DP direction
      tagsˆ.push ([tag, points])

      // Assign direction points
      const prev = dp.get (tag) ?? 0
      dp.set (tag, prev + points)}

    for (const [tag, points] of tagsˆ) {
      // Find the time delta from the previous point
      const tΔ = lastPoint ? Math.max (0, (tim.getTime() - lastPoint.getTime()) / 1000) : 0
      lastPoint = tim

      // Take 2/3 of `points` from other directions
      // Advancing direction D takes from directions Dⱼ but allows them to take from D in turn;
      // every direction is other directions reward
      let sum = 0
      for (const [t, p] of dp) if (!tagsˆ.find (tup => tup[0] == t)) sum += Math.max (0, p)
      for (let [direction, dipo] of dp) {
        if (tagsˆ.find (tup => tup[0] == direction)) continue
        if (!sum) continue
        const take = points * (dipo / sum) * .666
        if (take < dipo) dipo -= take
        if (tΔ > 0) {
          // Time takes points, making space for new achievements
          const rest = tΔ / 86400 / 7
          if (rest < dipo) dipo -= rest}
        dp.set (direction, dipo)}}}

  // Display the direction balance
  for (const [direction, points] of dp) {
    const pointsʹ = Math.round (points * 100) / 100
    if (pointsʹ < 0.57721) term.green (`${direction} ${pointsʹ} `)
    else if (pointsʹ < 1.2020569) term.yellow (`${direction} ${pointsʹ} `)
    else term.red (`${direction} ${pointsʹ} `)}
  console.log()

  // If we have an item “foo” at the beginning and at the end of the timeline
  // the linked map will only remember the beginning position and not the end one (FIFO),
  // hence to order the hints by recency we should reverse them before deduplication
  const items = new Map(), itemsᵃ = /** @type {string[]} */ ([])
  for (let ix = caᵃ.length - 1; ix >= 0; --ix) items.set (caᵃ[ix], 0)
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

  if (line.startsWith ('todo/')) {await readNote (term, 'todo', [line.substring (5)]); return}
  if (line == 'todo') {await readNote (term, line, []); return}

  const tags = new Set()
  for (;;) {
    term ('\n> ')
    const tagsʰ = [
      ...DIRECTIONS,  // DP
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
      await readNote (term, line, tags); return
    }
    tags.add (tag)
  }

  term.column (1) .eraseLine()

  log (`Saving to “${timelineᵖ}”…`)
  let tll = date.format (new Date(), YMDHMS) + ':'
  if (tags) tll += ' [' + [...tags].join (',') + ']'
  tll += ' ' + line + '\n'
  await fsp.appendFile (timelineᵖ, tll, {encoding: 'utf8'})
  term.processExit (0)

}())
