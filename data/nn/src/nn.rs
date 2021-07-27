// ⌥ Investigate [pinned memory](https://groups.google.com/g/arrayfire-users/c/7BihnZ-J8ig)

#![allow(unknown_lints, uncommon_codepoints)]

#[macro_use] extern crate fomat_macros;
#[macro_use] extern crate gstuff;
//#[macro_use] extern crate serde_derive;

use chrono::{Local, TimeZone};
use chrono::format::DelayedFormat;
use chrono::format::strftime::StrftimeItems;
use crossterm::QueueableCommand;
use crossterm::style::Color::{Green};
use pico_args::Arguments;
use std::io::Write;
//use std::thread;
//use std::time::Duration;

fn short_log_time (ms: u64) -> DelayedFormat<StrftimeItems<'static>> {
  let time = Local.timestamp_millis (ms as i64);
  time.format ("%d %H:%M:%S")}

macro_rules! log {
  (q $command: expr, $($args: tt)+) => {{
    gstuff::with_status_line (&|| {
      let mut stdout = std::io::stdout();
      let _ = stdout.queue ($command);
      let _ = wite! (&mut stdout,
        ($crate::short_log_time (::gstuff::now_ms())) ' '
        (::gstuff::filename (file!())) ':' (line!()) "] "
        $($args)+ '\n');
      let _ = stdout.queue (crossterm::style::ResetColor);
      let _ = stdout.flush();})}};
  (c $color: expr, $($args: tt)+) => {log! (q crossterm::style::SetForegroundColor ($color), $($args)+)};
  ($($args: tt)+) => {{
    gstuff::with_status_line (&|| {
      pintln! (
        ($crate::short_log_time (::gstuff::now_ms())) ' '
        (::gstuff::filename (file!())) ':' (line!()) "] "
        $($args)+);})}};}

mod mnist;

fn help() -> Result<(), String> {
  pintln! ("--info … ArrayFire info");
  pintln! ("--mnist … Experiment with MNIST");
  Ok(())}

fn main() -> Result<(), String> {
  let mut args = Arguments::from_env();

  if args.contains ("--help") {
    return help()}

  if args.contains ("--info") {
    log! (c Green, "HW");
    arrayfire::info();
    return Ok(())}

  if args.contains ("--mnist") {
    return mnist::mnist()}

  Ok(())}
