// https://youtu.be/Mi9ggpHLWGo Mapping 1 2 3 to 2 3 1 with ELM
// https://youtu.be/hH7V_P4UXNk Experimenting with WebDriver/fantoccini to offload the ELM plots
// https://youtu.be/tV9ezHzDPfA ELM H matmul

use arrayfire::{Array, Dim4, MatProp, Seq, af_print, index, join_many, matmul, pinverse, randu, set_seed, sin};
use crossterm::QueueableCommand;
use crossterm::style::Color::{DarkGrey, DarkYellow};
use gstuff::{re::Re, rdtsc};
use ndarray::Array2;
use ndarray_linalg::{SVDDC, UVTFlag};
use serde_json as json;
use std::{io::Write};

fn round_to (decimals: u32, num: f32) -> f32 {
  let r = 10u32 .pow (decimals) as f32;
  (num * r) .round() / r}

#[test] #[allow(non_snake_case)] fn test_svd() {
  // cf. https://youtu.be/DG7YTlGnCEo Singular Value Decomposition (SVD) and Image Compression

  // Example from https://youtu.be/Ls2TgGFfZnU
  let sample1 = [1f32, 0., -1., 1., 1., 1.];
  let as1 = Array::<f32>::new (&sample1, Dim4::new (&[3, 2, 1, 1]));
  af_print! ("as1 =", as1);
  let (U, Σ, Vᵗ) = arrayfire::svd (&as1);
  af_print! ("U =", U);
  af_print! ("Σ =", Σ);
  af_print! ("Vᵗ =", Vᵗ);
  let mut Vᵗʹ = [0f32; 4]; Vᵗ.host (&mut Vᵗʹ);
  let mut Σʹ = [0f32; 2]; Σ.host (&mut Σʹ);
  let mut Uʹ = [0f32; 9]; U.host (&mut Uʹ);
  // Row-major order
  let a1 = Array2::<f32>::from_shape_vec ((3, 2), vec! [1., 1., 0., 1., -1., 1.]) .unwrap();
  //let (U, Σ, Vᵗ) = a1.svd_inplace (true, true) .unwrap();
  let (U, Σ, Vᵗ) = a1.svddc (UVTFlag::Full) .unwrap();
  let U = U.unwrap(); let Vᵗ = Vᵗ.unwrap();
  pintln! ([=Vᵗ]);
  assert_eq! (Vᵗʹ[0], -0.);
  assert_eq! (round_to (7, Vᵗ[[0, 0]]), -0.);

  assert_eq! (Vᵗʹ[1], -1.);
  assert_eq! (Vᵗ[[1, 0]], 1.);

  assert_eq! (Vᵗʹ[2], -1.);
  assert_eq! (Vᵗ[[0, 1]], 1.);

  assert_eq! (Vᵗʹ[3], -0.);
  assert_eq! (round_to (7, Vᵗ[[1, 1]]), -0.);

  pintln! ([=Σ]);
  assert! ((Σʹ[0] - 3f32.sqrt()) .abs() < 0.001);
  assert! ((Σ[0] - 3f32.sqrt()) .abs() < 0.001);

  assert! ((Σʹ[1] - 2f32.sqrt()) .abs() < 0.001);
  assert! ((Σ[1] - 2f32.sqrt()) .abs() < 0.001);

  pintln! ([=U]);
  assert! ((Uʹ[0] - (-1. / 3f32.sqrt())) .abs() < 0.001);
  assert! ((U[[0, 0]] - (1. / 3f32.sqrt())) .abs() < 0.001);

  assert! ((Uʹ[1] - (-1. / 3f32.sqrt())) .abs() < 0.001);
  assert! ((U[[1, 0]] - (1. / 3f32.sqrt())) .abs() < 0.001);

  assert! ((Uʹ[2] - (-1. / 3f32.sqrt())) .abs() < 0.001);
  assert! ((U[[2, 0]] - (1. / 3f32.sqrt())) .abs() < 0.001);

  assert! ((Uʹ[3] - (-1. / 2f32.sqrt())) .abs() < 0.001);
  assert! ((U[[0, 1]] - (1. / 2f32.sqrt())) .abs() < 0.001);

  assert! ((Uʹ[4] - 0.) .abs() < 0.001);
  assert! ((U[[1, 1]] - 0.) .abs() < 0.001);

  assert! ((Uʹ[5] - (1. / 2f32.sqrt())) .abs() < 0.001);
  assert! ((U[[2, 1]] - (-1. / 2f32.sqrt())) .abs() < 0.001);

  assert! ((Uʹ[6] - (1. / 6f32.sqrt())) .abs() < 0.001);
  assert! ((U[[0, 2]] - (1. / 6f32.sqrt())) .abs() < 0.001);

  assert! ((Uʹ[7] - (-2. / 6f32.sqrt())) .abs() < 0.001);
  assert! ((U[[1, 2]] - (-2. / 6f32.sqrt())) .abs() < 0.001);

  assert! ((Uʹ[8] - (1. / 6f32.sqrt())) .abs() < 0.001);
  assert! ((U[[2, 2]] - (1. / 6f32.sqrt())) .abs() < 0.001);

  // Example from https://youtu.be/4tvw-1HI45s
  let sample2 = [3f32, -1., 1., 3., 1., 1.];
  let as2 = Array::<f32>::new (&sample2, Dim4::new (&[2, 3, 1, 1]));
  // Row-major order
  let a2 = Array2::<f32>::from_shape_vec ((2, 3), vec! [3., 1., 1., -1., 3., 1.]) .unwrap();
  af_print! ("-------\nas2 =", as2);
  let (U, Σ, Vᵗ) = arrayfire::svd (&as2);
  af_print! ("U =", U);
  af_print! ("Σ =", Σ);
  af_print! ("Vᵗ =", Vᵗ);
  let mut Vᵗʹ = [0f32; 9]; Vᵗ.host (&mut Vᵗʹ);
  let mut Σʹ = [0f32; 2]; Σ.host (&mut Σʹ);
  let (U, Σ, Vᵗ) = a2.svddc (UVTFlag::Full) .unwrap();
  let _U = U.unwrap(); let Vᵗ = Vᵗ.unwrap();
  pintln! ([=Vᵗ]);
  assert! ((Vᵗʹ[0] - (-1. / 6f32.sqrt())) .abs() < 0.001);
  assert! ((Vᵗ[[0, 0]] - (-1. / 6f32.sqrt())) .abs() < 0.001);

  assert! ((Vᵗʹ[1] - (2. / 5f32.sqrt())) .abs() < 0.001);
  assert! ((Vᵗ[[1, 0]] - (2. / 5f32.sqrt())) .abs() < 0.001);

  assert! ((Vᵗʹ[2] - (-1. / 30f32.sqrt())) .abs() < 0.001);
  assert! ((Vᵗ[[2, 0]] - (-1. / 30f32.sqrt())) .abs() < 0.001);

  assert! ((Vᵗʹ[3] - (-2. / 6f32.sqrt())) .abs() < 0.001);
  assert! ((Vᵗ[[0, 1]] - (-2. / 6f32.sqrt())) .abs() < 0.001);

  assert! ((Vᵗʹ[4] - (-1. / 5f32.sqrt())) .abs() < 0.001);
  assert! ((Vᵗ[[1, 1]] - (-1. / 5f32.sqrt())) .abs() < 0.001);

  assert! ((Vᵗʹ[5] - (-2. / 30f32.sqrt())) .abs() < 0.001);
  assert! ((Vᵗ[[2, 1]] - (-2. / 30f32.sqrt())) .abs() < 0.001);

  assert! ((Vᵗʹ[6] - (-1. / 6f32.sqrt())) .abs() < 0.001);
  assert! ((Vᵗ[[0, 2]] - (-1. / 6f32.sqrt())) .abs() < 0.001);

  assert! ((Vᵗʹ[7] - 0.) .abs() < 0.001);
  assert! ((Vᵗ[[1, 2]] - 0.) .abs() < 0.001);

  assert! ((Vᵗʹ[8] - (5. / 30f32.sqrt())) .abs() < 0.001);
  assert! ((Vᵗ[[2, 2]] - (5. / 30f32.sqrt())) .abs() < 0.001);

  pintln! ([=Σ]);
  assert! ((Σʹ[0] - 12f32.sqrt()) .abs() < 0.001);
  assert! ((Σ[0] - 12f32.sqrt()) .abs() < 0.001);

  assert! ((Σʹ[1] - 10f32.sqrt()) .abs() < 0.001);
  assert! ((Σ[1] - 10f32.sqrt()) .abs() < 0.001);}

/// Run a simple ELM, 123 to 321
pub fn elm() -> Result<(), String> {
  log! (c DarkGrey, "Loading training x and test t…");

  let samples = 3;
  let in_neurons = 1;
  let hidden_neurons = 2;
  let _out_neurons = 1;

  let x: Array<f32> = try_s! (json::from_str (r#"{
    "dtype": "F32",
    "shape": {"dims": [3, 1, 1, 1]},
    "data": [1, 2, 3]
  }"#));
  af_print! ("training x =", x);
  if x.dims()[0] != samples {return ERR! ("!samples: {}", x.dims()[0])}
  if x.dims()[1] != in_neurons {return ERR! ("!in_neurons: {}", x.dims()[1])}

  let t: Array<f32> = try_s! (json::from_str (r#"{
    "dtype": "F32",
    "shape": {"dims": [3, 1, 1, 1]},
    "data": [3, 2, 1]
  }"#));
  af_print! ("test t =", t);
  if t.dims()[0] != samples {return ERR! ("!samples: {}", t.dims()[0])}
  if t.dims()[1] != in_neurons {return ERR! ("!in_neurons: {}", x.dims()[1])}

  log! (c DarkGrey, "Randomly assing weight w and bias b…");

  let wᵈ = Dim4::new (&[in_neurons, hidden_neurons, 1, 1]);
  set_seed (rdtsc());
  let w = randu::<f32> (wᵈ);

  // ⌥ extend to negative weights?
  // ⌥ what is the smallest set of weights that still works? plot the generalization re norm of weights
  let bᵈ = Dim4::new (&[1, hidden_neurons, 1, 1]);
  let b = randu::<f32> (bᵈ);

  log! (c DarkGrey, "Calculating H…");

  // H = [
  //   g (w1 * x1 + b1)  …  g (wᶰ * x1 + bᶰ)
  //   …
  //   g (w1 * xN + b1)  …  g (wᶰ * xN + bᶰ)
  // ]
  // where
  //   ᶰ is a number of hidden neurons
  //   N is a number of training samples
  //   g is the activation function (such as `sin`)

  af_print! ("in→hidden weights w =", w);

  // cf. https://arrayfire.org/docs/group__blas__func__matmul.htm
  let h1 = matmul (&x, &w, MatProp::NONE, MatProp::NONE);
  af_print! ("h1 = x * w =", h1);

  af_print! ("bias b =", b);

  let mut biased = Vec::with_capacity (hidden_neurons as usize);
  for hi in 0 .. hidden_neurons {
    let column_start = hi * samples;
    let column = index (&h1, &[Seq::new (column_start as f64, (column_start + samples - 1) as f64, 1.)]);
    let bias = index (&b, &[Seq::new (hi as f64, hi as f64, 1.)]);
    biased.push (column + bias)}
  let h2 = join_many (1, biased.iter().collect());
  af_print! ("h2 = h1 + bias =", h2);

  let h3 = sin (&h2);
  af_print! ("h3 = sin (h2) =", h3);
  // cf. https://arrayfire.org/docs/group__lapack__ops__func__pinv.htm
  let h4 = pinverse (&h3, 1e-6, MatProp::NONE);
  af_print! ("h4 = pinverse (h3) =", h4);

  let β = matmul (&h4, &t, MatProp::NONE, MatProp::NONE);
  af_print! ("β = H†T =", β);  // Where “†” is pinverse

  for x in 0 .. 5 {
    log! (c DarkYellow, "Inferencing from " (x) "…");
    let x = Array::new (&[x], Dim4::new (&[in_neurons, 1, 1, 1]));
    af_print! ("x =", x);
    let i1 = x * &w;
    af_print! ("i1 = x * w =", i1);
    let i2 = i1 + &b;
    af_print! ("i2 = i1 + b =", i2);
    let i3 = sin (&i2);
    af_print! ("i3 = sin (i2) =", i3);
    let i = matmul (&i3, &β, MatProp::NONE, MatProp::NONE);
    af_print! ("i = matmul (i3, β) =", i);}

  // ⌥ calculate the loss and MSE

  Ok(())}

/// Experiment with ELM activations
pub async fn elm_snake() -> Re<()> {
  // tbd
  Re::Ok(())}
