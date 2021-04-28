#![allow(unknown_lints, uncommon_codepoints)]

#[macro_use] extern crate fomat_macros;
#[macro_use] extern crate gstuff;

use std::io::Read;

use chrono::{Local, TimeZone};
use chrono::format::DelayedFormat;
use chrono::format::strftime::StrftimeItems;
use flate2::read::GzDecoder;

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
  status! ("Loading " (pathsᵘ) "…");
  let rc = try_s! (attohttpc::get (pathsᵘ) .send());
  assert! (rc.headers().contains_key ("x-amz-storage-class"));
  assert! (rc.headers().contains_key ("etag"));
  assert! (rc.headers().get ("server") .map (|v| v.as_bytes() == b"AmazonS3") .unwrap_or (false));
  let pathsᵇ = try_s! (rc.bytes());
  let mut pathsᶻ = GzDecoder::new (&pathsᵇ[..]);
  let mut paths = String::new();
  try_s! (pathsᶻ.read_to_string (&mut paths));
  log! ((paths));
  Ok(())}
