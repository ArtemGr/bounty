#![allow(unknown_lints, uncommon_codepoints)]

#![feature(with_options)]

#[macro_use] extern crate fomat_macros;
#[macro_use] extern crate gstuff;

use attohttpc::header::CONTENT_LENGTH;
use chrono::{Local, TimeZone};
use chrono::format::DelayedFormat;
use chrono::format::strftime::StrftimeItems;
use flate2::read::GzDecoder;
use std::env;
use std::fs;
use std::io::{Read, Write};

macro_rules! status {($($args: tt)+) => {if *::gstuff::ISATTY {
  ::gstuff::status_line (file!(), line!(), fomat! ($($args)+))}}}

fn short_log_time (ms: u64) -> DelayedFormat<StrftimeItems<'static>> {
  let time = Local.timestamp_millis (ms as i64);
  time.format ("%d %H:%M:%S")}

macro_rules! log {($($args: tt)+) => {{
  gstuff::with_status_line (&|| {
    pintln! (
      ($crate::short_log_time (::gstuff::now_ms())) ' '
      (::gstuff::filename (file!())) ':' (line!()) "] "
      $($args)+);})}}}

fn main() -> Result<(), String> {
  let pathsᵘ = "https://commoncrawl.s3.amazonaws.com/crawl-data/CC-MAIN-2021-10/warc.paths.gz";
  status! ("Loading " (pathsᵘ) '…');
  let rc = try_s! (attohttpc::get (pathsᵘ) .send());
  assert! (rc.headers().contains_key ("x-amz-storage-class"));
  assert! (rc.headers().contains_key ("etag"));
  assert! (rc.headers().get ("server") .map (|v| v.as_bytes() == b"AmazonS3") .unwrap_or (false));
  let pathsᵇ = try_s! (rc.bytes());
  let mut pathsᶻ = GzDecoder::new (&pathsᵇ[..]);
  let mut paths = String::with_capacity (8 * 1024 * 1024);
  try_s! (pathsᶻ.read_to_string (&mut paths));

  // ⌥ track the downloads with a file

  let home = try_s! (env::var ("HOME"));
  let mut ccdl = try_s! (fs::File::with_options()
    .append (true)
    .create (true)
    .open (fomat! ((home) "/.common-crawl-dl.yaml")));

  let mut cnt = 0;

  for path in paths.split ('\n') {
    let url = fomat! ("https://commoncrawl.s3.amazonaws.com/" (path));
    let mut rc = try_s! (attohttpc::get (&url) .send());
    let len = try_s! (rc.headers().get (CONTENT_LENGTH) .ok_or ("!CONTENT_LENGTH"));
    let len = try_s! (len.to_str());
    let len = try_s! (len.parse::<usize>());

    let mut buf = [0u8; 65536];
    let mut total = 0;
    loop {
      let got = try_s! (rc.read (&mut buf));
      if got == 0 {break}
      total += got}

    assert_eq! (total, len);
    log! ([len]);

    try_s! (wite! (&mut ccdl,
      "- url: \"" (url) "\"\n"
      // ⌥ "  when: " () "\n"
      "  downloaded: " (len) "\n"));

    cnt += 1;
    if 111 < cnt {break}}

  Ok(())}
