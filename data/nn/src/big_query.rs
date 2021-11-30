// https://youtu.be/NmbexXFXHa0 automl 123 → 321

// tbd:
// AutoML Tables was not able to split the data into test and training sets. Please check your label values to ensure each label is not unique

use gcp_bigquery_client::model::{dataset::Dataset, query_request::QueryRequest, table_data_insert_all_request::TableDataInsertAllRequest, job_status::JobStatus};
use gstuff::{re::Re};
use serde_derive::Serialize;
use tokio::runtime::Runtime;

async fn big_queryʹ() -> Re<()> {
  let gcp_sa_key = "api-project-193635906495-6d12d5589d02.json";
  let client = gcp_bigquery_client::Client::from_service_account_key_file (gcp_sa_key) .await;
  let project_id = "api-project-193635906495";

  let _dataset = match client.dataset().create (
    // https://cloud.google.com/bigquery/docs/datasets
    // https://cloud.google.com/bigquery/docs/locations
    Dataset::new (project_id, "123") .location ("US") .friendly_name ("123 → 321")) .await {
      Ok (_) => (),
      Err (err) if err.to_string().contains ("\"reason\": \"duplicate\"") => (),
      Err (err) => return Re::fail (err)};

  macro_rules! sql {
    ($query: expr, $ignore_if: expr) => {
      match client.job().query (project_id, QueryRequest::new ($query)) .await {
        Ok (rs) => Some (rs),
        Err (err) => {
          let err = err.to_string();
          if !$ignore_if.iter().any (|i| err.contains (i)) {return Re::fail (err)}
          None}}};
    ($query: expr) => {sql! ($query, [] as [&'static str; 0])}}

  // https://cloud.google.com/bigquery/docs/tables
  let rs = sql! ("
    CREATE TABLE `123.123` (
      x INT64,
      y INT64,
      data_split STRING)",
    ["\"reason\": \"duplicate\""]);
  if let Some (rs) = rs {log! ([rs.column_names()])}

  sql! ("DELETE FROM `123.123` WHERE 1 = 1",
    [" would affect rows in the streaming buffer,"]);

  #[derive(Serialize)] struct Row<'a> {x: i64, y: i64, data_split: &'a str}
  let mut insert = TableDataInsertAllRequest::new();
  for (x, y) in [(1, 3), (2, 2), (3, 1)] {
    for i in 0..=333 {
      insert.add_row (None, Row {x, y, data_split: if i < 300 {"UNASSIGNED"} else {"TEST"}})?}}
  client.tabledata().insert_all (project_id, "123", "123", insert) .await?;

  let mut rs = sql! ("SELECT COUNT(*) FROM `123.123`")?;
  let rows = {rs.next_row(); rs.get_i64 (0)??};
  log! ((rows) " rows");

  let mut rs = sql! ("SELECT data_split, COUNT(*) FROM `123.123` GROUP BY data_split")?;
  while rs.next_row() {let n = rs.get_string (0)??; let c = rs.get_i64 (1)??; log! ((n) ' ' (c))}

  let rs = sql! ("
    CREATE OR REPLACE MODEL `123.model`
    OPTIONS (MODEL_TYPE = 'automl_classifier', BUDGET_HOURS = 1, INPUT_LABEL_COLS = ['y'])
    AS SELECT x, y FROM `123.123`")?;
  let job_id = rs.query_response().job_reference.as_ref()?.job_id.as_ref()?;
  log! ([=job_id]);

  // wait for the ML job to finish
  loop {
    let job = client.job().get_job (project_id, job_id, None) .await?;
    if let Some (JobStatus {state: Some (ref stateʹ), ..}) = job.status {
      if stateʹ == "RUNNING" {
        log! ([=stateʹ]);
        std::thread::sleep (std::time::Duration::from_secs (12));
        continue}}
    log! ([job]); break}

  Re::Ok(())}

pub fn big_query() -> Re<()> {
  let rt  = Runtime::new()?;
  rt.block_on (big_queryʹ())?;
  Re::Ok(())}
