require("dotenv").config();
const express = require("express");
const router = express.Router();

const pg = require('pg')
let database = new pg.Pool({
  host: 'localhost',
  user: process.env.DBUSER,
  database: process.env.DBNAME,
  password: process.env.DBPASS,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

router.get("/", async function(req, res) {
  let results = await getActivity(database);
  if (results) {
    res.status(200).send(results);
  } else {
    res.status(404).send(`Error.`);
  }
});

router.get("/members", async function(req, res) {
  let results = await getMembers(database);
  if (results) {
    res.status(200).send(results);
  } else {
    res.status(404).send(`Error.`);
  }
});

router.get("/heatmap", async function(req, res) {
  let results = await constructHeatmap(database);
  if (results) {
    res.status(200).send(results);
  } else {
    res.status(404).send(`Error.`);
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
            "SELECT member_id, experience_value, game_name, journey_start, journey_end, journey_duration FROM public.udl_journal WHERE journey_start > NOW() - INTERVAL '1 year' AND journey_end > NOW() - INTERVAL '1 year'",
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
    if (results && results.rows) {
      resolve(results.rows);
    } else {
      resolve(false);
    }
  });
}

async function constructHeatmap(database) {
  return new Promise(async (resolve, reject) => {
    let heatmap = []
    for (let hour = 0; hour < 24; hour++) {
      heatmap.push(await retrieveHourlyBucket(database, hour))
    }
    if (heatmap) {
      resolve(heatmap);
    } else {
      resolve(false);
    }
  });
}

async function retrieveHourlyBucket(database, hourlyBucket) {
  return new Promise(async (resolve, reject) => {
    let results;
    let bucketStart = hourlyBucket;
    let bucketEnd = hourlyBucket + 1;
    try {
      results = await database
        .query({
          text:
            "SELECT COUNT(*) FROM public.udl_activity WHERE online_event >= CURRENT_TIMESTAMP - interval '90 days' AND ((DATE_PART('hour', offline_event) > DATE_PART('hour',online_event) AND DATE_PART('hour',online_event) < $1  AND DATE_PART('hour', offline_event) >= $2) OR (DATE_PART('hour', offline_event) < DATE_PART('hour',online_event) AND (DATE_PART('hour', offline_event) <= $2 AND DATE_PART('hour',online_event) < $1)))",
          values: [bucketEnd, bucketStart]
        })
        .catch(e => console.log(e));
    } catch (e) {
      console.error(e);
    }
    if (results && results.rows) {
      resolve({
        hour: hourlyBucket,
        heat: results.rows[0].count
      });
    } else {
      resolve({
        hour: hourlyBucket,
        heat: -1      
      });
    }
  });
}