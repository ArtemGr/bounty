// cargo build --release

#![allow(uncommon_codepoints)]

#[macro_use] extern crate fomat_macros;
#[macro_use] extern crate gstuff;
#[macro_use] extern crate serde_json;

use chrono::{TimeZone, Utc};
use gstuff::now_ms;
use serde_json::{self as json, Value as Json};
use serde_yaml::{self as yaml, Value as Yaml};
use std::fs;
use std::{io::{Read, Write}, ptr::slice_from_raw_parts};

use serde::Serialize;

#[derive(Debug, Serialize)]
struct Note {
  item: String,
  tags: Vec<String>,
  tim: String,
  note: String,
  video: Option<String>}

fn mainʹ() -> Result<Vec<u8>, String> {
  // ⌥ read the incoming message from stdin
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging#app_side

  let stdin = std::io::stdin();
  let mut stdin = stdin.lock();
  let mut in_len = [0u8; 4];
  try_s! (stdin.read_exact (&mut in_len));
  let in_len: &i32 = unsafe {std::mem::transmute (in_len.as_ptr())};
  let in_len = *in_len as usize;

  let mut in_buf = Vec::with_capacity (in_len);
  in_buf.resize (in_len, 0);
  try_s! (stdin.read_exact (&mut in_buf));
  let in_js: Json = try_s! (json::from_slice (&in_buf));

  //let title = try_s! (in_js ["title"] .as_str().ok_or ("!title"));
  //let txt = in_js ["txt"] .as_str();

  // https://discourse.mozilla.org/t/native-extension-exceed-message-limit/59039/4
  // “the first 32 bits of your message must be a unit with the length of the string you are sending in bytes”
  let reply = json! ({"in_len": in_len});
  let reply = try_s! (json::to_vec (&reply));
  Ok (reply)}

fn main() {
  let reply = match mainʹ() {
    Ok (k) => k,
    Err (err) => json::to_vec (&json! ({"err": err})) .unwrap()};

  let len: i32 = reply.len() as i32;
  let len: &[u8] = unsafe {&*slice_from_raw_parts (&len as *const i32 as *const u8, 4)};
  let stdout = std::io::stdout();
  let mut stdout = stdout.lock();
  let _ = stdout.write_all (&len);
  let _ = stdout.write_all (&reply);}
