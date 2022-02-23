#![allow(unknown_lints, uncommon_codepoints)]

use fomat_macros::pintln;
use gstuff::re::Re;
use gstuff::{round_to, slurp};
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

  Re::Ok(())}

fn main() {
  mainʹ().unwrap()}
