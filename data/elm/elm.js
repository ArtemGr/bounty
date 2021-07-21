//@ts-check

// https://www.kaggle.com/robertbm/extreme-learning-machine-example

// https://youtu.be/oq3tq-0gxOs importing and loading MNIST
// https://youtu.be/AhmSUmrAkeQ solving dependency duplication due to version mismatch

// Note that in our “package.json” we should be using the same version of
// “@tensorflow/tfjs-node” that the
// https://github.com/tensorflow/tfjs-examples/blob/master/mnist-node/package.json
// uses, otherwise we'll get the kind of “backend was already registered” warnings mentioned at
// https://github.com/tensorflow/tfjs/issues/708#issuecomment-422923513
import * as tf from '@tensorflow/tfjs';

// https://github.com/tensorflow/tfjs-examples/blob/master/mnist-node/data.js
import * as mnistʹ from 'tfjs-examples-mnist-node/data.js';
import {log} from 'log';
import fs from 'fs';
const fsp = fs.promises;

async function loadMnist() {
  // @ts-ignore
  const mnist = /** @type {mnistʹ} */ (mnistʹ.default)

  const data = await mnist.loadData()
  log (data)
}

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
