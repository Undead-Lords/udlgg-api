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
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

router.get("/", async function(req, res) {
  let results = await getActivity(database);
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
      let eventStart = await dayjs(i.start_stamp); 
      let startDay = eventStart.get('day')
      let startHour = eventStart.get('hour');
      let hourDuration = Math.ceil(parseInt(i.duration)/60)
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
            "SELECT activity.id, activity.member_id, activity.start_stamp, activity.end_stamp, CEIL(EXTRACT(EPOCH FROM (activity.end_stamp - activity.start_stamp))/60) AS duration, activity.channel FROM public.udl_participation AS activity JOIN public.udl_roster AS roster ON activity.member_id = roster.member_id WHERE activity.type = 'voice' AND NOT activity.channel = 'AFK' AND NOT roster.privacy = 2 AND NOT roster.active = FALSE AND activity.start_stamp > (current_date - INTERVAL '36 months') ORDER BY activity.start_stamp DESC",
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
