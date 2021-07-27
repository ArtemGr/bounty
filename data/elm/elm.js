//@ts-check

// https://www.kaggle.com/robertbm/extreme-learning-machine-example

// https://youtu.be/oq3tq-0gxOs importing and loading MNIST
// https://youtu.be/AhmSUmrAkeQ solving dependency duplication due to version mismatch
// https://youtu.be/0mcyw5uapWc running tfjs-examples-mnist-node on copied tensors
// https://youtu.be/dXRyUurAy3k is TensorFlow a good fit and why turn low level

const crypto = require ('crypto');
const fs = require ('fs'); const fsp = fs.promises;
const {assert, log} = require ('log');

/** @returns {import ('@tensorflow/tfjs')} */
function requireTensorFlow() {
  try {
    // @ts-ignore
    return require ('@tensorflow/tfjs-node-gpu');
  } catch (ex) {
    log ('No GPU')
    try {
      // @ts-ignore
      return require ('@tensorflow/tfjs-node')
    } catch (ex) {
      log ('No native')
      return require ('@tensorflow/tfjs')}}}

const tf = requireTensorFlow()

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

function modelʹ() {
  const model = tf.sequential();
  model.add(tf.layers.conv2d({
    inputShape: [28, 28, 1],
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
  }));
  model.add(tf.layers.conv2d({
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
  }));
  model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
  }));
  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
  }));
  model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dropout({rate: 0.25}));
  model.add(tf.layers.dense({units: 512, activation: 'relu'}));
  model.add(tf.layers.dropout({rate: 0.5}));
  model.add(tf.layers.dense({units: 10, activation: 'softmax'}));

  const optimizer = 'rmsprop';
  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model}

async function tbd() {
  const dump = await fsp.open ('dump.ns', 'r')

  log (`Loading trainImagesData..`)
  const trainImagesShape = JSON.parse ((await loadChunk (dump)) .toString ('utf8'))
  const trainImagesData = await loadFloat (dump)
  const images = tf.tensor4d (trainImagesData, trainImagesShape)
  //log (images)

  log (`Loading trainLabelsData..`)
  const trainLabelsData = await loadFloat (dump)
  const labels = tf.tensor2d (trainLabelsData, [60000, 10])
  //log (labels)

  log (`Loading testImagesData..`)
  const testImagesShape = JSON.parse ((await loadChunk (dump)) .toString ('utf8'))
  const testImagesData = await loadFloat (dump)
  const testImages = tf.tensor4d (testImagesData, testImagesShape)
  //log (testImages)

  log (`Loading testLabelsData..`)
  const testLabelsData = await loadFloat (dump)
  const testLabels = tf.tensor2d (testLabelsData, [10000, 10])
  log (testLabels)

  await dump.close()

  // running tfjs-examples-mnist-node on copied tensors

  const model = modelʹ();
  model.summary();

  const validationSplit = 0.15;
  const numTrainExamplesPerEpoch = images.shape[0] * (1 - validationSplit);
  const batchSize = 128;
  const epochs = 3;
  const numTrainBatchesPerEpoch = Math.ceil (numTrainExamplesPerEpoch / batchSize);
  await model.fit (images, labels, {
    epochs,
    batchSize,
    validationSplit
  });

  const evalOutput = model.evaluate (testImages, testLabels);

  console.log(
      `\nEvaluation result:\n` +
      `  Loss = ${evalOutput[0].dataSync()[0].toFixed(3)}; `+
      `Accuracy = ${evalOutput[1].dataSync()[0].toFixed(3)}`);
}

function help() {
  console.log ('node elm.js --tbd')}

(async () => {
  if (process.argv.includes ('--help')) {help(); return}
  if (process.argv.includes ('--tbd')) {await tbd(); return}
})()
