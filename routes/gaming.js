require("dotenv").config();
const express = require("express");
const router = express.Router();
const dayjs = require('dayjs')

const pg = require('pg')
let database = new pg.Pool({
  host: 'localhost',
  user: process.env.DBUSER,
  database: process.env.DBNAME,
  password: process.env.DBPASS,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 20000
})

router.get("/", async function(req, res) {
  let results = await getActivity(database);
  if (results) {
    res.status(200).send(results);
  } else {
    res.status(404).send(`No results were returned.`);
  }
});

router.get("/list", async function(req, res) {
  let results = await getList(database);
  if (results) {
    res.status(200).send(results);
  } else {
    res.status(404).send(`No results were returned.`);
  }
});

router.get("/heatmap", async function(req, res) {
  let results = await getActivity(database);
  let heatmap = await buildHeatmap(results)
  if (results) {
    res.status(200).send(heatmap); 
    } else {
    res.status(404).send(`No results were returned.`);
  }
});


module.exports = router;

async function buildHeatmap(results){
  return new Promise(async (resolve, reject) => {
    let rowConstruct = [];
    for (let i of results) {
      let eventStart = await dayjs(i.journey_start); 
      let startDay = eventStart.get('day')
      let startHour = eventStart.get('hour');
      let hourDuration = Math.ceil(parseInt(i.journey_duration)/60)
      let rowEntry;
  
      //set initial loop steps
      let curHour = startHour;
      let curDay = startDay
      for(let numHours = 0; numHours <= hourDuration; numHours++) {
        rowEntry = {
          'id': i.id,
          'hour': curHour,
          'day': curDay
        };
        rowConstruct.push(rowEntry);
        curHour++
        if(curHour > 23) curHour = 0  
        if(curHour == 0) {
          if(curDay == 6) { curDay = 0 } else { curDay++ }
        }
      }
    }
    resolve(rowConstruct)
  })
}

async function getActivity(database) {
  return new Promise(async (resolve, reject) => {
    let results;
    try {
      results = await database
        .query({
          text:
            "SELECT journal.id, journal.member_id, journal.game_name, journal.journey_start, journal.journey_end, journal.journey_duration FROM public.udl_journal AS journal JOIN public.udl_roster AS roster ON journal.member_id = roster.member_id WHERE journal.journey_start > (current_date - INTERVAL '36 months') AND NOT roster.privacy = 2 AND NOT roster.active = FALSE ORDER BY journal.journey_start DESC",
          values: []
        })
        .catch(e => console.log(e));
    } catch (e) {
      console.error(e);
    }
    if (results && results.rowCount > 0) {
      resolve(results.rows);
    } else {
      resolve(false);
    }
  });
}


async function getList(database) {
  return new Promise(async (resolve, reject) => {
    let results;
    try {
      results = await database
        .query({
          text:
            "SELECT DISTINCT game_name AS games FROM public.udl_journal ORDER BY game_name ASC",
          values: []
        })
        .catch(e => console.log(e));
    } catch (e) {
      console.error(e);
    }
    if (results && results.rowCount > 0) {
      resolve(results.rows);
    } else {
      resolve(false);
    }
  });
}