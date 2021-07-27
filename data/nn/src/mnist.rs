use crossterm::QueueableCommand;
use crossterm::style::Color::{DarkGrey};
use std::{fs, io::Write};
//use std::io::Write;
use std::path::Path;

const FILES: &'static [(&'static str, u64); 4] = &[
  ("train-images-idx3-ubyte.gz", 9912422),
  ("train-labels-idx1-ubyte.gz", 28881),
  ("t10k-images-idx3-ubyte.gz", 1648877),
  ("t10k-labels-idx1-ubyte.gz", 4542)];

fn load() -> Result<(), String> {
  // cf. https://github.com/tensorflow/tfjs-examples/blob/master/mnist-node/data.js
  let base = "https://storage.googleapis.com/cvdf-datasets/mnist/";
  for (fname, flen) in FILES {
    let fpath = Path::new (fname);
    if let Ok (fmeta) = fpath.metadata() {if fmeta.is_file() && fmeta.len() == *flen {continue}}
    log! (c DarkGrey, "Fetching " (fname) "…");
    let mut bytes = try_s! (try_s! (attohttpc::get (fomat! ((base) (fname))) .send()) .bytes());
    let fnameᵗ = fomat! ((fname) ".tmp");
    let mut tmp = try_s! (fs::File::create (&fnameᵗ));
    try_s! (tmp.write_all (&mut bytes));
    drop (tmp);
    try_s! (fs::rename (fnameᵗ, fname));}
  Ok(())}

pub fn mnist() -> Result<(), String> {
  try_s! (load());
  Ok(())}
