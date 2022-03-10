#![allow(unknown_lints, uncommon_codepoints, mixed_script_confusables)]

use fomat_macros::{fomat, pintln};
use gstuff::re::Re;
use gstuff::{fail, round_to, slurp};
use serde_json as json;
use tch::Tensor;
use tch::{nn, nn::Module, nn::OptimizerConfig, Device, Reduction};

/// Example of a specialized network, reused in a generic network.
#[derive(Debug)]
struct Act2Vel {bias: Tensor, i2o: Tensor}
impl Act2Vel {
  fn new (vs: &nn::Path) -> Act2Vel {
    let bound = 1.0 / (2 as f64) .sqrt();
    Act2Vel {
      bias: vs.var ("bias", &[1], nn::Init::Uniform {lo: -bound, up: bound}),
      i2o: vs.var ("i2o", &[1, 2], nn::Init::KaimingUniform)}}}
impl Module for Act2Vel {
  fn forward (&self, xs: &Tensor) -> Tensor {
    // use just the “previous velocity” and the “action” columns for the “action → velocity” inference
    let xs = xs.index (&[None, Some (&Tensor::of_slice (&[1i64, 4]))]);
    xs.matmul (&self.i2o.tr()) + &self.bias}}

#[derive(Debug)]
struct Net {a2v: Act2Vel, bs: Tensor, i2h: Tensor, h2o: Tensor}
impl Net {
  fn new (vs: &nn::Path) -> Net {
    const HIDDEN: i64 = 5;
    let bound = 1.0 / (5 as f64) .sqrt();
    Net {
      a2v: Act2Vel::new (&(vs / "a2v")),
      bs: vs.var ("bias", &[HIDDEN], nn::Init::Uniform {lo: -bound, up: bound}),
      i2h: vs.var ("i2h", &[HIDDEN, 6], nn::Init::KaimingUniform),
      h2o: vs.var ("h2o", &[4, HIDDEN], nn::Init::KaimingUniform)}}}
impl Module for Net {
  fn forward (&self, xs: &Tensor) -> Tensor {
    let velocity = self.a2v.forward (xs);

    // add separately predicted velocity into inputs
    // cf. https://pytorch.org/docs/stable/generated/torch.cat.html
    let xs = Tensor::cat (&[xs, &velocity], 1);

    let xs = xs.matmul (&self.i2h.tr()) + &self.bs;
    // Learns better without activation.
    //let xs = xs.relu();
    xs.matmul (&self.h2o.tr())}}

fn mainʹ() -> Re<()> {
  let sessions: Vec<(Vec<u8>, Vec<(f32, f32, f32, f32)>)> = json::from_slice (&slurp (&"cartpole.json"))?;
  let mut inputsᵃ = Vec::<f32>::new();
  let mut outputsᵃ = Vec::<f32>::new();
  for (actions, observations) in &sessions {
    for ix in 1 .. actions.len() {
      let obs = &observations[ix-1];
      inputsᵃ.push (obs.0);  // Cart Position
      inputsᵃ.push (obs.1);  // Cart Velocity
      inputsᵃ.push (obs.2);  // Pole Angle
      inputsᵃ.push (obs.3);  // Pole Angular Velocity
      inputsᵃ.push (actions[ix] as f32);
      outputsᵃ.push (observations[ix].0);  // Cart Position
      outputsᵃ.push (observations[ix].1);  // Cart Velocity
      outputsᵃ.push (observations[ix].2);  // Pole Angle
      outputsᵃ.push (observations[ix].3)}}  // Pole Angular Velocity
  let inputs = Tensor::of_slice (&inputsᵃ) .view((inputsᵃ.len() as i64 / 5, 5));
  let outputs = Tensor::of_slice (&outputsᵃ) .view((outputsᵃ.len() as i64 / 4, 4));

  let velocity_outputs = outputs.index (&[None, Some (&Tensor::of_slice (&[1i64]))]);

  let vs = nn::VarStore::new (Device::Cpu);
  let net = Net::new (&vs.root());
  let mut opt = nn::Adam::default().build (&vs, 0.1)?;
  opt.set_weight_decay (0.01);
  for epoch in 1 ..= 2022 {
    let a2v_loss = net.a2v.forward (&inputs) .mse_loss (&velocity_outputs, Reduction::Sum);
    opt.backward_step (&a2v_loss);
    let a2v_lossᶠ = f32::from (&a2v_loss);

    let loss = net.forward (&inputs) .mse_loss (&outputs, Reduction::Sum);
    opt.backward_step (&loss);
    let lossᶠ = f32::from (&loss);
    pintln! ("epoch " {"{:>4}", epoch} " "
      " a2v_loss " {"{:<7}", round_to (3, a2v_lossᶠ)}
      " loss " {"{:<7}", round_to (3, lossᶠ)});
    if lossᶠ < 0.1 {break}}

  for ix in 0..13 {
    let input = Tensor::of_slice (&inputsᵃ[ix * 5 .. (ix + 1) * 5]) .view((1, 5));
    let velocity = net.a2v.forward (&input);
    let prediction = net.forward (&input);
    pintln! ("velocity expected " {"{:>7.4}", outputsᵃ[ix * 4 + 1]}
      " a2v " {"{:>7.4}", f32::from (velocity)}
      " net " {"{:>7.4}", f32::from (prediction.get (0) .get (1))})}

  pintln! ("--- a2v i2o ---");
  net.a2v.i2o.print();
  pintln! ("--- a2v bias ---");
  net.a2v.bias.print();

  // ⌥ train the velocity formula directly with Adam,
  // velocity = (previous_velocity * 1.0010 + action * 0.3900) - 0.1950
  // velocity = previous_velocity + action ? 0.2 : -0.2

  Re::Ok(())}

// ⌥ implement a version of Adam that runs on a mutable slice of parameters, and a minimised closure

fn adam2plus2() -> Re<()> {
  // cf. https://arxiv.org/pdf/1412.6980.pdf Adam: a method for stochastic optimization

  // Adam is a “mathematical optimization” with the goal of minimizing a function.
  // Most of the time the function we want to minimize is the loss function:
  // the smaller the loss, the better the fitness of the parameters picked (aka model).
  // For “2 + x = 4” the loss function would be “(2 - x) ^ 2”.
  fn loss (x: f32) -> f32 {(2. - x) .powi (2)}

  // “The gradient always points in the direction of steepest increase in the loss function.”
  // In Autograd the gradient is calculated automatically together with the loss
  // and is consequently reused by the optimization algorithm.
  //
  // Another popular option seems to be in implementing the gradient as derivative of the loss.
  // “The derivative of a function y = f(x) of a variable x is a measure of the rate
  // at which the value y of the function changes with respect to the change of the variable x.”
  // For `a^2` [the known derivative is `2a`](https://en.wikipedia.org/wiki/Derivative#Example).
  // fn dloss (x: f32) -> f32 {2. * (2. - x)}
  //
  // Optimisation will be more genetic, however, if we would treat the loss function as a black box,
  // calculating the gradient from the difference between the current and the previous loss.
  // cf. https://en.wikipedia.org/wiki/Numerical_differentiation; fʹ(x) = (f(x+h) - f(x)) / h
  fn dloss (loss1: f32, loss0: f32, h: f32) -> f32 {(loss1 - loss0) / h}

  let α = 0.001;
  let β1 = 0.9;
  let β2 = 0.999;
  let ε: f32 = 0.1;
  let mut m: f32 = 0.;
  let mut v: f32 = 0.;
  let mut t = 0;
  let mut θ: f32 = 0.0;

  let mut lossᵖ = loss (θ);
  let mut g = ε;

  loop {
    t += 1;
    m = β1 * m + (1. - β1) * g;
    v = β2 * v + (1. - β2) * g .powi (2);

    let mˆ = m / (1. - β1 .powi (t));
    if mˆ.is_nan() {fail! ("mˆ NaN")}

    let vˆ = v / (1. - β2 .powi (t));
    if vˆ.is_nan() {fail! ("vˆ NaN")}

    let θᵗ = θ - α * mˆ / (vˆ.sqrt() + ε);
    if θᵗ.is_nan() {fail! ("θ NaN")}

    let lossᵗ = loss (θᵗ);
    g = dloss (lossᵗ, lossᵖ, θᵗ - θ);
    θ = θᵗ; lossᵖ = lossᵗ;

    if lossᵗ < 0.01 {break}  // stop if converged
    if t % 1000 == 0 {pintln! ([=t] ' ' [=θ] ' ' [=g] ' ' [=lossᵗ])}}

  pintln! ("Converged in " (t) " steps; " [=θ]);
  Re::Ok(())}

fn amsgrad() -> Re<()> {
  // cf. https://openreview.net/pdf?id=ryQu7f-RZ On the convergence of Adam and Beyond
  fn loss (x: f32) -> f32 {(2. - x) .powi (2)}
  fn dloss (loss1: f32, loss0: f32, h: f32) -> f32 {(loss1 - loss0) / h}

  let α = 0.001;
  let β1 = 0.9;
  let β2 = 0.999;
  let ε: f32 = 0.1;
  let mut m = 0.;
  let mut v: f32 = 0.;
  let mut vˆ: f32 = 0.;
  let mut t = 0;
  let mut θ: f32 = 0.;

  let mut lossᵖ = loss (θ);
  let mut g = ε;

  loop {
    t += 1;
    m = β1 * m + (1. - β1) * g;
    v = β2 * v + (1. - β2) * g .powi (2);
    vˆ = vˆ .max (v);
    let θʹ = θ - α * m / vˆ.sqrt();

    let lossᵗ = loss (θʹ);
    g = dloss (lossᵗ, lossᵖ, θʹ - θ);
    θ = θʹ; lossᵖ = lossᵗ;

    if lossᵗ < 0.001 {break}  // stop if converged
    if t % 1000 == 0 {pintln! ([=t] ' ' [=θ] ' ' [=g] ' ' [=lossᵗ])}}

  pintln! ("Converged in " (t) " steps; " [=θ]);
  Re::Ok(())}

fn adabelief() -> Re<()>{
  // cf. https://arxiv.org/pdf/2010.07468.pdf AdaBelief Optimizer: Adapting Stepsizes by the Belief in Observed Gradients
  // https://www.youtube.com/playlist?list=PL7KkG3n9bER6YmMLrKJ5wocjlvP7aWoOu AdaBelief Optimizer, Toy examples
  fn loss (x: f32) -> f32 {(2. - x) .powi (2)}
  fn dloss (loss1: f32, loss0: f32, h: f32) -> f32 {(loss1 - loss0) / h}
  let α = 0.001;
  let β1 = 0.9;
  let β2 = 0.999;
  let ε: f32 = 0.01;
  let mut m: f32 = 0.;
  let mut s: f32 = 0.;
  let mut t = 0;
  let mut θ: f32 = 0.0;

  let mut lossᵖ = loss (θ);
  let mut g = ε;

  loop {
    t += 1;
    m = β1 * m + (1. - β1) * g;
    s = β2 * s + (1. - β2) * (g - m) .powi (2);  // + ε

    let mˆ = m / (1. - β1 .powi (t));
    if mˆ.is_nan() {fail! ("mˆ NaN")}

    // “Note that an extra ε is added to sᵗ during bias-correction, in order to
    // better match the assumption that sᵗ is bounded below (the lower bound is at least ε).”
    let sˆ = (s + ε) / (1. - β2 .powi (t));
    if sˆ.is_nan() {fail! ("sˆ NaN")}

    // “Intuitively, 1/√s is the “belief” in the observation: viewing mᵗ as the prediction of the gradient,
    // if gᵗ deviates much from mᵗ, we have weak belief in gᵗ, and take a small step;
    // if gᵗ is close to the prediction mᵗ, we have a strong belief in gᵗ, and take a large step.”
    let θᵗ = θ - α * mˆ / (sˆ.sqrt() + ε);
    if θᵗ.is_nan() {fail! ("θ NaN")}

    let lossᵗ = loss (θᵗ);
    g = dloss (lossᵗ, lossᵖ, θᵗ - θ);
    θ = θᵗ; lossᵖ = lossᵗ;

    if lossᵗ < 0.01 {break}  // stop if converged
    if t % 100 == 0 {pintln! ([=t] ' ' [=θ] ' ' [=g] ' ' [=m] ' ' [=s] ' ' [=lossᵗ])}}

  pintln! ("Converged in " (t) " steps; " [=θ]);
  Re::Ok(())}

fn main() {
  adabelief().unwrap(); return;
  amsgrad().unwrap(); return;
  adam2plus2().unwrap(); return;
  mainʹ().unwrap()}
