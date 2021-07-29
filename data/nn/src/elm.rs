// https://youtu.be/Mi9ggpHLWGo Mapping 1 2 3 to 2 3 1 with ELM

use arrayfire::{Array, Dim4, MatProp, Seq, af_print, index, join_many, matmul, pinverse, randu, set_seed, sin};
use crossterm::QueueableCommand;
use crossterm::style::Color::{DarkGrey, DarkYellow};
use fantoccini::{ClientBuilder, Locator};
use gstuff::{rdtsc, slurp_prog};
use regex::Regex;
use serde_json as json;
use std::process::{Command, Stdio};
use std::{io::Write};

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
  af_print! ("β = H†T =", β);

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
pub async fn elm_snake() -> Result<(), String> {
  // Figure out the IP, in order to reach the Windows version of geckodriver from WSL2
  let ipconfig = try_s! (slurp_prog ("/mnt/c/Windows/System32/ipconfig.exe"));
  // NB: The active IP usually has the “Default Gateway” filled
  let re = try_s! (Regex::new (r"\sIPv4 Address[\. ]+: ([\d\.]+)+\s+Subnet Mask[\. ]+: ([\d\.]+)\s+Default Gateway[\. ]+: ([\d\.]+)\s"));
  let mut ip = None;
  for ca in re.captures_iter (&ipconfig) {ip = Some (ca[1].to_string())}
  let ip = try_s! (ip.ok_or ("Found no IP in ipconfig"));
  log! (c DarkGrey, "IP: " (ip));
  // Start geckodriver, WebDriver proxy for Firefox
  let mut gecmd = try_s! (Command::new ("geckodriver.exe")
    .arg ("--host") .arg (&ip)
    .arg ("--port") .arg ("4444")
    .stdout (Stdio::null())  // As of 2021-07 “inherit” would confuse WSL2 and/or bash readline
    .stderr (Stdio::inherit())
    .spawn());

  let geurl = fomat! ("http://" (ip) ":4444");
  let mut client = try_s! (ClientBuilder::native().connect (&geurl) .await);

  try_s! (client.goto ("https://echarts.apache.org/examples/en/editor.html?c=simple-surface&gl=1") .await);

  let mut code_panel = try_s! (client.wait_for_find (Locator::Id ("code-panel")) .await);
  let textarea = try_s! (code_panel.find (Locator::Css ("textarea")) .await);
  log! ([textarea]);

  try_s! (gecmd.kill());  // Bye, geckodriver!
  Ok(())}
