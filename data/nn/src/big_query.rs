use gcp_bigquery_client::model::{dataset::Dataset, query_request::QueryRequest};
use tokio::runtime::Runtime;
use gstuff::{re::Re};
use std::future::Future;

async fn big_queryʹ() -> Re<()> {
  let gcp_sa_key = "api-project-193635906495-6d12d5589d02.json";
  let client = gcp_bigquery_client::Client::from_service_account_key_file (gcp_sa_key) .await;
  let project_id = "api-project-193635906495";

  let dataset = match client.dataset().create (
    // https://cloud.google.com/bigquery/docs/datasets
    Dataset::new (project_id, "one_two_three") .location ("US") .friendly_name ("123 → 321")) .await {
      Ok (dataset) => dataset,
      Err (err) if err.to_string().contains ("\"reason\": \"duplicate\"") => {
        client.dataset().get (project_id, "one_two_three") .await?},
      Err (err) => return Re::fail (err)};

  log! ("got the dataset");

  // https://cloud.google.com/bigquery/docs/tables
  let rs = client.job().query (project_id, QueryRequest::new ("
    CREATE TABLE one_two_three.one_two_three (
      x INT64,
      y INT64)
  ")).await?;
  log! ([=rs]);
  Re::Ok(())}

pub fn big_query() -> Re<()> {
  let rt  = Runtime::new()?;
  rt.block_on (big_queryʹ())?;
  Re::Ok(())}
