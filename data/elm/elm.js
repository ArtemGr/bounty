//@ts-check

// https://www.kaggle.com/robertbm/extreme-learning-machine-example

// https://youtu.be/oq3tq-0gxOs importing and loading MNIST
// https://youtu.be/AhmSUmrAkeQ solving dependency duplication due to version mismatch

import * as tf from '@tensorflow/tfjs';
import crypto from 'crypto';
import fs from 'fs'; const fsp = fs.promises;
import {assert, log} from 'log';

/** @param {fs.promises.FileHandle} dump */
async function loadFloat (dump) {
  const lenʹ = Buffer.alloc (4)
  assert (4 == (await dump.read (lenʹ, 0, 4)) .bytesRead)
  const len = lenʹ.readUInt32LE (0)

  const buf = Buffer.alloc (len)
  assert (len == (await dump.read (buf, 0, len)) .bytesRead)
  const float = new Float32Array (buf.buffer)
  const md5 = crypto.createHash ('md5') .update (float) .digest ('hex')

  const ckbuf = Buffer.alloc (32)
  assert (32 == (await dump.read (ckbuf, 0, 32)) .bytesRead)
  assert (md5 == ckbuf.toString ('utf8'))

  return float}

async function tbd() {
  const dump = await fsp.open ('dump.ns', 'r')
  log (`Loading trainImagesData..`)
  const trainImagesData = await loadFloat (dump)
  log (`Loading trainLabelsData..`)
  const trainLabelsData = await loadFloat (dump)
  log (`Loading testImagesData..`)
  const testImagesData = await loadFloat (dump)
  log (`Loading testLabelsData..`)
  const testLabelsData = await loadFloat (dump)
  await dump.close()

  // ⌥ Re-create the Tensor
}

function help() {
  console.log ('node elm.js --tbd')}

(async () => {
  if (process.argv.includes ('--help')) {help(); return}
  if (process.argv.includes ('--tbd')) {await tbd(); return}
})()
