use gstuff::{re::Re};

// ⌥ represent species by seed (and creature - by number of steps/mutations from seed)

// https://github.com/pkalivas/radiate/tree/master/radiate/src/models
use radiate::{Activation, Config, Genocide, Neat, NeatEnvironment, Population, Problem};

pub struct Inverse {}
impl Inverse {
  fn show (&self, net: &mut Neat) {
    pintln! ("1 → " [net.forward (&vec! [1.])]);
    pintln! ("2 → " [net.forward (&vec! [2.])]);
    pintln! ("3 → " [net.forward (&vec! [3.])])}}
impl Problem<Neat> for Inverse {
  fn empty() -> Self {Inverse {}}
  fn solve (&self, net: &mut Neat) -> f32 {
    let v1 = net.forward (&vec! [1.]) .unwrap() [0];
    let v2 = net.forward (&vec! [2.]) .unwrap() [0];
    let v3 = net.forward (&vec! [3.]) .unwrap() [0];
    let score = (1. - (3. - v1) .abs().min (1.)) +
      (1. - (2. - v2) .abs().min (1.)) +
      (1. - (1. - v3) .abs().min (1.));
    score}}

pub fn neat() -> Re<()> {
  let env = NeatEnvironment::new()
    .set_weight_mutate_rate (0.8)
    .set_edit_weights (0.1)
    .set_weight_perturb (1.5)
    .set_new_node_rate (0.14)
    .set_new_edge_rate (0.14)
    .set_recurrent_neuron_rate (0.0)
    .set_reactivate (0.2)
    .set_activation_functions (vec! [
      Activation::Sigmoid,
      Activation::Relu]);

  let net = Neat::new()
    .input_size (1)
    .dense_pool (1, Activation::Sigmoid);

  let problem = Inverse::empty();
  let (mut solution, _env) = Population::<Neat, NeatEnvironment, Inverse>::new()
    .constrain (env)
    .size (100)
    .populate_clone (net)
    .dynamic_distance (true)
    .stagnation (31, vec! [Genocide::KillWorst (0.69)])
    .configure (Config {
      inbreed_rate: 0.001,
      crossover_rate: 0.31,
      distance: 0.31,
      species_target: 31})
    .run (|_, fit, num| {
      if num % 20 == 0 {println! ("Generation: {}, score: {}", num, fit)}
      num == 100})?;

  problem.show (&mut solution);
  Re::Ok(())}
