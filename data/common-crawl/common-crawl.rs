#![allow(unknown_lints, uncommon_codepoints)]

#[macro_use] extern crate fomat_macros;
#[macro_use] extern crate gstuff;

use chrono::{Local, TimeZone};
use chrono::format::DelayedFormat;
use chrono::format::strftime::StrftimeItems;

fn short_log_time (ms: u64) -> DelayedFormat<StrftimeItems<'static>> {
  let time = Local.timestamp_millis (ms as i64);
  time.format ("%d %H:%M:%S")}

macro_rules! log {($($args: tt)+) => {{
  gstuff::with_status_line (&|| {
    pintln! (
      ($crate::short_log_time (::gstuff::now_ms())) ' '
      (::gstuff::filename (file!())) ':' (line!()) "] "
      $($args)+);})}}}

fn main() {
  log! ("hello world")
}
