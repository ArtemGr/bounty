// https://github.com/tensorflow/tfjs-examples/blob/master/mnist-node/data.js
const mnistʹ = require ('tfjs-examples-mnist-node/data.js');
const crypto = require ('crypto');
const fs = require ('fs'); const fsp = fs.promises;
const {assert, log} = require ('log');

function dumpChunk (/** @type {fs.WriteStream} */ dump, /** @type {Uint8Array} */ chunk) {
  const len = Buffer.allocUnsafe (4)
  len.writeUInt32LE (chunk.byteLength, 0)
  dump.write (new Uint8Array (len))

  dump.write (chunk)

  const md5 = crypto.createHash ('md5') .update (chunk) .digest ('hex')
  assert (md5.length == 32)
  dump.write (md5)}

async function loadMnist() {
  const mnist = mnistʹ

  await mnist.loadData()
  const train = mnist.getTrainData()
  const test = mnist.getTestData()

  const dump = fs.createWriteStream ('dump.ns', {encoding: 'binary'})

  const trainImagesData = /** @type {Float32Array} */ (train.images.dataSync())
  log (`Dumping trainImagesData, ${Math.round (trainImagesData.byteLength / 1024 / 1024)} MiB..`)
  const utf8 = new TextEncoder ('utf8')
  dumpChunk (dump, new Uint8Array (utf8.encode (JSON.stringify (train.images.shape))))
  dumpChunk (dump, new Uint8Array (trainImagesData.buffer))

  const trainLabelsData = train.labels.dataSync()
  log (`Dumping trainLabelsData, ${Math.round (trainLabelsData.byteLength / 1024 / 1024)} MiB..`)
  dumpChunk (dump, new Uint8Array (trainLabelsData.buffer))

  const testImagesData = test.images.dataSync()
  log (`Dumping testImagesData, ${Math.round (testImagesData.byteLength / 1024 / 1024)} MiB..`)
  dumpChunk (dump, new Uint8Array (utf8.encode (JSON.stringify (test.images.shape))))
  dumpChunk (dump, new Uint8Array (testImagesData.buffer))

  const testLabelsData = test.labels.dataSync()
  log (`Dumping testLabelsData, ${Math.round (testLabelsData.byteLength / 1024 / 1024)} MiB..`)
  dumpChunk (dump, new Uint8Array (testLabelsData.buffer))

  const finish = new Promise ((resolve, reject) => {
    dump.on ('finish', resolve)
    dump.on ('error', reject)})
  dump.end()
  await finish

  log (test.labels)}

async function clean() {
  await fsp.unlink ('t10k-images-idx3-ubyte')
  await fsp.unlink ('t10k-labels-idx1-ubyte')
  await fsp.unlink ('train-images-idx3-ubyte')
  await fsp.unlink ('train-labels-idx1-ubyte')}

function help() {
  console.log ('node elm.js --load-mnist')
  console.log ('node elm.js --clean')}

(async () => {
  if (process.argv.includes ('--help')) {help(); return}
  if (process.argv.includes ('--load-mnist')) {await loadMnist(); return}
  if (process.argv.includes ('--clean')) {await clean(); return}
})()
