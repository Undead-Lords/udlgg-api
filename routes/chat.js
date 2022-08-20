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
    res.status(404).send(`No results were returned.`);
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
            "SELECT activity.id, activity.member_id, activity.start_stamp, activity.channel, activity.sentiment FROM public.udl_participation AS activity JOIN public.udl_roster AS roster ON activity.member_id = roster.member_id WHERE activity.type = 'text' AND NOT roster.privacy = 2 AND NOT roster.active = FALSE AND activity.start_stamp > (current_date - INTERVAL '24 months')",
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
