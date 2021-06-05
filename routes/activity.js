require("dotenv").config();
const express = require("express");
const router = express.Router();

const moment = require("moment");
const { Pool } = require("pg");
const database = new Pool({
  host: "localhost",
  user: process.env.DBUSER,
  database: process.env.DBNAME,
  password: process.env.DBPASS,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

router.get("/", async function(req, res) {
  let results = await getActivity(database);
  if (results) {
    res.status(200).send(results);
  } else {
    res.status(404).send(`Error retrieving activity logs.`);
  }
});

router.get("/members", async function(req, res) {
  let results = await getMembers(database);
  if (results) {
    res.status(200).send(results);
  } else {
    res.status(404).send(`Error retrieving member roster.`);
  }
});

module.exports = router;

async function getActivity(database) {
  return new Promise(async (resolve, reject) => {
    let results;
    try {
      results = await database
        .query({
          text:
            "SELECT member_id, experience_value, game_name, journey_start, journey_end, journey_duration FROM public.udl_journal WHERE journey_start > NOW() - INTERVAL '90 days' AND journey_end > NOW() - INTERVAL '90 days'",
          values: []
        })
        .catch(e => console.log(e));
    } catch (e) {
      console.error(e);
    }
    if (results.rows) {
      resolve(results.rows);
    } else {
      resolve(false);
    }
  });
}

async function getMembers(database) {
  return new Promise(async (resolve, reject) => {
    let results;
    try {
      results = await database
        .query({
          text:
            "SELECT member_id, member_name, member_rank, last_online FROM public.udl_roster",
          values: []
        })
        .catch(e => console.log(e));
    } catch (e) {
      console.error(e);
    }
    if (results.rows) {
      resolve(results.rows);
    } else {
      resolve(false);
    }
  });
}
