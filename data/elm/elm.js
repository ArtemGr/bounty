//@ts-check

// https://www.kaggle.com/robertbm/extreme-learning-machine-example

// https://youtu.be/oq3tq-0gxOs importing and loading MNIST
// https://youtu.be/AhmSUmrAkeQ solving dependency duplication due to version mismatch

const tf = require ('@tensorflow/tfjs-node');
const crypto = require ('crypto');
const fs = require ('fs'); const fsp = fs.promises;
const {assert, log} = require ('log');

// Hint to hide the “AVX2” warning, cf. https://stackoverflow.com/a/66071396/257568
if (process.env ['TF_CPP_MIN_LOG_LEVEL'] == null) {
  console.log ('set TF_CPP_MIN_LOG_LEVEL=2')}

async function loadChunk (/** @type {fs.promises.FileHandle} */ dump) {
  const lenʹ = Buffer.alloc (4)
  assert (4 == (await dump.read (lenʹ, 0, 4)) .bytesRead)
  const len = lenʹ.readUInt32LE (0)

  const buf = Buffer.alloc (len)
  assert (len == (await dump.read (buf, 0, len)) .bytesRead)
  const md5 = crypto.createHash ('md5') .update (buf) .digest ('hex')

  const ckbuf = Buffer.alloc (32)
  assert (32 == (await dump.read (ckbuf, 0, 32)) .bytesRead)
  assert (md5 == ckbuf.toString ('utf8'))

  return buf}

async function loadFloat (/** @type {fs.promises.FileHandle} */ dump) {
  const buf = await loadChunk (dump)
  return new Float32Array (buf.buffer)}

async function loadInt (/** @type {fs.promises.FileHandle} */ dump) {
  const buf = await loadChunk (dump)
  return new Int32Array (buf.buffer)}

async function tbd() {
  const dump = await fsp.open ('dump.ns', 'r')

  log (`Loading trainImagesData..`)
  const trainImagesShape = JSON.parse ((await loadChunk (dump)) .toString ('utf8'))
  const trainImagesData = await loadFloat (dump)
  const images = tf.tensor4d (trainImagesData, trainImagesShape)
  //log (images)

  log (`Loading trainLabelsData..`)
  const trainLabelsData = await loadInt (dump)
  const labels = tf.oneHot (tf.tensor1d (trainLabelsData, 'int32'), 10) .toFloat()
  //log (labels)

  log (`Loading testImagesData..`)
  const testImagesShape = JSON.parse ((await loadChunk (dump)) .toString ('utf8'))
  const testImagesData = await loadFloat (dump)
  const testImages = tf.tensor4d (testImagesData, testImagesShape)
  //log (testImages)

  log (`Loading testLabelsData..`)
  const testLabelsData = await loadInt (dump)
  const testLabels = tf.oneHot (tf.tensor1d (testLabelsData, 'int32'), 10) .toFloat()
  log (testLabels)

  await dump.close()
}

function help() {
  console.log ('node elm.js --tbd')}

(async () => {
  if (process.argv.includes ('--help')) {help(); return}
  if (process.argv.includes ('--tbd')) {await tbd(); return}
})()
