// https://youtu.be/oHd9R6tbeCg Преимущества native messaging; подключаем ext-driver

#![allow(uncommon_codepoints)]

#[macro_use] extern crate fomat_macros;
#[macro_use] extern crate gstuff;
#[macro_use] extern crate serde_json;

use chrono::{TimeZone, Utc};
use gstuff::{binprint, now_ms};
use serde_json::{self as json, Value as Json};
use serde_yaml::{self as yaml, Value as Yaml};
use std::fs;
use std::process::{Command, Stdio};
use std::{io::{Read, Write}, ptr::slice_from_raw_parts};

use serde::Serialize;

fn handle (in_js: Json) -> Result<Json, String> {
  if in_js["mode"] == "forward" {
    let bin = try_s! (in_js["bin"].as_str().ok_or ("!bin"));
    let args = try_s! (in_js["args"].as_array().ok_or ("!args"));
    let dir = try_s! (in_js["dir"].as_str().ok_or ("!dir"));

    let mut cmd = Command::new (bin);
    for arg in args {
      match arg {
        Json::String (s) => {cmd.arg (s);},
        Json::Number (n) => {cmd.arg (fomat! ((n)));},
        x => return ERR! ("Unknown type: {:?}", x)}}
    cmd.current_dir (dir);
    cmd.stdin (Stdio::null());
    cmd.stdout (Stdio::piped());
    cmd.stderr (Stdio::piped());
    let output = try_s! (cmd.output());
    if !output.status.success() {
      return ERR! ("!ok: {:?}, {}", output.status.code(), binprint (&output.stderr, b'.'))}
    let stdout = try_s! (String::from_utf8 (output.stdout));
    let stderr = try_s! (String::from_utf8 (output.stderr));

    let reply = json! ({
      "stdout": stdout.trim(),
      "stderr": stderr.trim()});
    return Ok (reply)}

  return ERR! ("!mode")}

#[test] fn test_forward() {
  let foobar = handle (json! ({
    "mode": "forward",
    "bin": "sqlite3",
    "args": [":memory:", "select 2 + 2"],
    "dir": "c:/"
  })) .unwrap();
  assert_eq! (foobar, json! ({"stderr": "", "stdout": "4"}));}


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
  let reply = try_s! (handle (in_js));
  let reply = try_s! (json::to_vec (&reply));
  Ok (reply)}

fn main() {
  let reply = match mainʹ() {
    Ok (k) => k,
    Err (err) => json::to_vec (&json! ({"err": err})) .unwrap()};

  // https://discourse.mozilla.org/t/native-extension-exceed-message-limit/59039/4
  // “the first 32 bits of your message must be a unit with the length of the string you are sending in bytes”
  let len: i32 = reply.len() as i32;
  let len: &[u8] = unsafe {&*slice_from_raw_parts (&len as *const i32 as *const u8, 4)};
  let stdout = std::io::stdout();
  let mut stdout = stdout.lock();
  let _ = stdout.write_all (&len);
  let _ = stdout.write_all (&reply);}
