#!/usr/bin/env python
# https://www.gymlibrary.ml/pages/environments/classic_control/cart_pole

import json
import sys
import time

import numpy as np
from llog import floora, floorʹ, log

if '--spin' in sys.argv:
  import gym

  sessions = []

  # 'Blackjack-v1', 'FrozenLake-v1', 'Taxi-v3', 'MountainCar-v0', 'FrozenLake-v1', 'Pendulum-v1',
  # 'Acrobot-v1', 'MountainCarContinuous-v0'
  env = gym.make('CartPole-v1')

  while len(sessions) < 1234:
    env.reset()
    actions = []
    observations = []
    for frame in range(234):
      #env.render()
      #time.sleep(.02)

      action = int(env.action_space.sample())
      observation, reward, done, info = env.step(action)

      actions.append(action)
      observations.append(observation.tolist())

      if done:
        break

    sessions.append((actions, observations))

  env.close()

  open('cartpole.json', 'w').write(json.dumps(sessions))


def load_inputs():
  sessions = json.loads(open('cartpole.json', 'r').read())
  inputs, outputs = [], []
  for actions, observations in sessions:
    for j in range(1, len(observations)):
      inputs.append([*observations[j - 1], actions[j]])
      outputs.append(observations[j])
  return sessions, inputs, outputs


if '--elm' in sys.argv:  # Inference with ELM
  sys.path.insert(0, '..')
  import elm.elm as elm
  sys.path.remove('..')

  # infer: elm (stateⱼ₋₁, actionⱼ) = stateⱼ
  _, inputs, outputs = load_inputs()
  weights, bias, β = elm.train(31, inputs, outputs)
  #    3 .. 0.27
  #   31 .. 0.22
  #  314 .. 0.22
  # 1234 .. 0.22

  predictions = []
  for input in inputs:
    predictions.append(elm.infer(weights, bias, β, input))

  mse = np.square(np.subtract(outputs, predictions)).mean()
  log(floorʹ(mse))

if '--tf' in sys.argv:  # Inference with TF
  from tensorflow import keras
  from tensorflow.keras import layers

  tf_inputs = keras.Input(shape=(5,), name="state-and-action")
  x = layers.Dense(314, activation="relu", name="dense_1")(tf_inputs)
  x = layers.Dense(314, activation="relu", name="dense_2")(x)
  tf_outputs = layers.Dense(4, activation="softmax", name="state-prediction")(x)
  #   3 .. 0.18
  #  31 .. 0.18
  # 314 .. 0.18

  model = keras.Model(inputs=tf_inputs, outputs=tf_outputs)

  model.compile(optimizer=keras.optimizers.RMSprop(), loss=keras.losses.MeanSquaredError())

  _, inputs, outputs = load_inputs()
  inputs = np.vstack(inputs).astype('float32')
  outputs = np.vstack(outputs).astype('float32')

  # https://www.tensorflow.org/api_docs/python/tf/keras/Model#fit
  history = model.fit(inputs[3:], outputs[3:], validation_split=0.01, epochs=2)

  predictions = model.predict(inputs)
  log(outputs[0], '-', predictions[0])

  mse = np.square(np.subtract(outputs, predictions)).mean()
  log(floorʹ(mse))

if '--neat' in sys.argv:  # Inference with NEAT
  import neat

  config = neat.Config(neat.DefaultGenome, neat.DefaultReproduction, neat.DefaultSpeciesSet,
                       neat.DefaultStagnation, 'neat.conf')
  p = neat.Population(config)
  p.add_reporter(neat.StdOutReporter(False))

  _, inputs, outputs = load_inputs()

  def eval_genomes(genomes, config):
    for genome_id, genome in genomes:
      genome.fitness = 4.0
      net = neat.nn.FeedForwardNetwork.create(genome, config)
      for count, (input, expected) in enumerate(zip(inputs, outputs)):
        prediction = net.activate(input)
        genome.fitness -= np.square(np.subtract(prediction, expected)).mean()
        if 31 < count:
          break

  winner = p.run(eval_genomes)

  log('Best genome:\n{!s}'.format(winner))

  winner_net = neat.nn.FeedForwardNetwork.create(winner, config)

  for input, expected in zip(inputs, outputs):
    prediction = winner_net.activate(input)
    log("  input {!r}, expected output {!r}, got {!r}".format(input, expected, floora(prediction)))
    break
