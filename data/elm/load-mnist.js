// https://github.com/tensorflow/tfjs-examples/blob/master/mnist-node/data.js
import * as mnistʹ from 'tfjs-examples-mnist-node/data.js';
import crypto from 'crypto';
import fs from 'fs'; const fsp = fs.promises;
import {assert, log} from 'log';

async function loadMnist() {
  // @ts-ignore
  const mnist = /** @type {mnistʹ} */ (mnistʹ.default)

  await mnist.loadData()
  const train = mnist.getTrainData()
  const test = mnist.getTestData()

  const dump = fs.createWriteStream ('dump.ns', {encoding: 'binary'})

  const trainImagesData = /** @type {Float32Array} */ (train.images.dataSync())
  log (`Dumping trainImagesData, ${Math.round (trainImagesData.byteLength / 1024 / 1024)} MiB..`)
  const len = Buffer.allocUnsafe (4)
  len.writeUInt32LE (trainImagesData.byteLength, 0)
  dump.write (new Uint8Array (len))
  dump.write (new Uint8Array (trainImagesData.buffer))
  const md5 = crypto.createHash ('md5') .update (trainImagesData) .digest ('hex')
  assert (md5.length == 32)
  dump.write (md5)

  const trainLabelsData = train.labels.dataSync()
  log (`Dumping trainLabelsData, ${Math.round (trainLabelsData.byteLength / 1024 / 1024)} MiB..`)
  len.writeUInt32LE (trainLabelsData.byteLength, 0)
  dump.write (new Uint8Array (len))
  dump.write (new Uint8Array (trainLabelsData.buffer))
  dump.write (crypto.createHash ('md5') .update (trainLabelsData) .digest ('hex'))

  const testImagesData = test.images.dataSync()
  log (`Dumping testImagesData, ${Math.round (testImagesData.byteLength / 1024 / 1024)} MiB..`)
  len.writeUInt32LE (testImagesData.byteLength, 0)
  dump.write (new Uint8Array (len))
  dump.write (new Uint8Array (testImagesData.buffer))
  dump.write (crypto.createHash ('md5') .update (testImagesData) .digest ('hex'))

  const testLabelsData = test.labels.dataSync()
  log (`Dumping testLabelsData, ${Math.round (testLabelsData.byteLength / 1024 / 1024)} MiB..`)
  len.writeUInt32LE (testLabelsData.byteLength, 0)
  dump.write (new Uint8Array (len))
  dump.write (new Uint8Array (testLabelsData.buffer))
  dump.write (crypto.createHash ('md5') .update (testLabelsData) .digest ('hex'))

  const finish = new Promise ((resolve, reject) => {
    dump.on ('finish', resolve)
    dump.on ('error', reject)})
  dump.end()
  await finish

  log (train.images)}

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
