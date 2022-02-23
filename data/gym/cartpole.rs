#![allow(unknown_lints, uncommon_codepoints)]

use fomat_macros::pintln;
use gstuff::re::Re;
use gstuff::slurp;
use serde_json as json;
use tch::Tensor;
use tch::{nn, nn::Module, nn::OptimizerConfig, Device, Reduction};

#[derive(Debug)]
struct Linear {ws: Tensor, bs: Tensor}
impl Linear {
  fn new (vs: &nn::Path, in_dim: i64, out_dim: i64) -> Linear {
    let bound = 1.0 / (in_dim as f64) .sqrt();
    Linear {
      ws: vs.var ("weight", &[out_dim, in_dim], nn::Init::KaimingUniform),
      bs: vs.var ("bias", &[out_dim], nn::Init::Uniform {lo: -bound, up: bound})}}}
impl Module for Linear {
  fn forward (&self, xs: &Tensor) -> Tensor {
    xs.matmul (&self.ws.tr()) + &self.bs}}

#[derive(Debug)]
struct Net {l1: Linear, l2: Linear}
impl Net {
  fn new (vs: &nn::Path) -> Net {
    const HIDDEN_NODES: i64 = 31;
    Net {
      l1: Linear::new (&(vs / "layer1"), 5, HIDDEN_NODES),
      l2: Linear::new (vs, HIDDEN_NODES, 4)}}}
impl Module for Net {
  fn forward (&self, xs: &Tensor) -> Tensor {
    let xs = self.l1.forward (xs);
    //let xs = xs.relu();
    self.l2.forward (&xs)}}

fn mainʹ() -> Re<()> {
  let sessions: Vec<(Vec<u8>, Vec<(f32, f32, f32, f32)>)> = json::from_slice (&slurp (&"cartpole.json"))?;
  let mut inputsᵃ = Vec::<f32>::new();
  let mut outputsᵃ = Vec::<f32>::new();
  for (actions, observations) in &sessions {
    for ix in 1 .. actions.len() {
      let obs = &observations[ix-1];
      inputsᵃ.push (obs.0);
      inputsᵃ.push (obs.1);
      inputsᵃ.push (obs.2);
      inputsᵃ.push (obs.3);
      inputsᵃ.push (actions[ix] as f32);
      outputsᵃ.push (observations[ix].0);
      outputsᵃ.push (observations[ix].1);
      outputsᵃ.push (observations[ix].2);
      outputsᵃ.push (observations[ix].3)}}
  let inputs = Tensor::of_slice (&inputsᵃ) .view((inputsᵃ.len() as i64 / 5, 5));
  let outputs = Tensor::of_slice (&outputsᵃ) .view((outputsᵃ.len() as i64 / 4, 4));

  let vs = nn::VarStore::new (Device::Cpu);
  let net = Net::new (&vs.root());
  let mut opt = nn::Adam::default().build (&vs, 0.1)?;
  opt.set_weight_decay (0.01);
  for epoch in 1 ..= 2022 {
    let loss = net.forward (&inputs) .mse_loss (&outputs, Reduction::Sum);
    opt.backward_step (&loss);
    let lossᶠ = f64::from (&loss);
    pintln! ("epoch " (epoch) " loss " (lossᶠ));
    if lossᶠ < 0.1 {break}}

  for ix in 0..3 {
    let input = Tensor::of_slice (&inputsᵃ[ix * 5 .. (ix + 1) * 5]);
    let prediction = net.forward (&input);
    pintln! ([&outputsᵃ[ix * 4 .. (ix + 1) * 4]] " vs " [prediction])}

  Re::Ok(())}

fn main() {
  mainʹ().unwrap()}
