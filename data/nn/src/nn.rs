// ⌥ Investigate [pinned memory](https://groups.google.com/g/arrayfire-users/c/7BihnZ-J8ig)

#![allow(unknown_lints, uncommon_codepoints, mixed_script_confusables)]

#[macro_use] extern crate fomat_macros;
#[macro_use] extern crate gstuff;
//#[macro_use] extern crate serde_derive;

use async_std::task;
use chrono::{Local, TimeZone};
use chrono::format::DelayedFormat;
use chrono::format::strftime::StrftimeItems;
use crossterm::QueueableCommand;
use crossterm::style::Color::{Green};
use gstuff::{re::Re};
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
mod neat;
mod elm;
mod big_query;

fn help() -> Re<()> {
  pintln! ("--info … ArrayFire info");
  pintln! ("--mnist … Experiment with MNIST");
  pintln! ("--elm … Run a simple ELM, 123 to 321");
  pintln! ("--elm-snake … Experiment with ELM activations");
  pintln! ("--neat … Run a simple NEAT, 123 to 321");
  pintln! ("--big-query … tbd");
  Re::Ok(())}

fn main() -> Re<()> {
  let mut args = Arguments::from_env();

  if args.contains ("--help") {
    return help()}

  if args.contains ("--info") {
    log! (c Green, "HW");
    arrayfire::info();
    return Re::Ok(())}

  if args.contains ("--mnist") {
    return mnist::mnist()}

  if args.contains ("--elm") {
    return Re::Ok (elm::elm()?)}

  if args.contains ("--elm-snake") {
    return Re::Ok (task::block_on (elm::elm_snake())?)}

  if args.contains ("--neat") {
    return neat::neat()}

  if args.contains ("--big-query") {
    return big_query::big_query()}

  Re::Ok(())}
