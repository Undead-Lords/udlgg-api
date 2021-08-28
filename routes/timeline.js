require("dotenv").config();
const express = require("express");
const router = express.Router();
const fs = require("fs")
const pg = require('pg')
const dayjs = require('dayjs')
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

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
  let results = false;
  try { 
      results = await database
         .query({
            text: "SELECT * FROM public.udl_timeline WHERE event_start <= NOW() ORDER BY event_start DESC",
            values: []
          })
        .catch(e => console.log(e));
    } catch (e) {
      console.error(e);
    }
  if (results && results.rowCount > 0) {
    res.status(200).send(results.rows);
  } else {
    res.status(404).send(`The Undead Lords Timeline is currently unavailable. Please try again soon.`);
  }
});

router.get("/upcoming", async function(req, res) {
  let results = false;
  try { 
      results = await database
         .query({
            text: "SELECT * FROM public.udl_timeline WHERE event_start > NOW() ORDER BY event_start DESC",
            values: []
          })
        .catch(e => console.log(e));
    } catch (e) {
      console.error(e);
    }
  if (results && results.rowCount > 0) {
    res.status(200).send(results.rows);
  } else if ( results && results.rowCount==0){
    res.status(200).send('There are no upcoming events!');
  } else {
    res.status(404).send(`The Undead Lords Timeline is currently unavailable. Please try again soon.`);
  }
});

router.get("/:id", async function(req, res) {
  let results = false;
  if (req.params.id && req.params.id.toLowerCase().contains("knighting")) {
    let name = req.params.id.toLowerCase()
    try { 
        results = await database
          .query({
              text: "SELECT * FROM public.udl_timeline WHERE LOWER(event_type) = $1 ORDER BY event_start DESC",
              values: [name]
            })
          .catch(e => console.log(e));
      } catch (e) {
        console.error(e);
      }
  } 
  if (results && results.rowCount > 0) {
    res.status(200).send(results.rows);
  } else {
    res.status(404).send(`The Undead Lords Timeline is currently unavailable. Please try again soon.`);
  }
});


module.exports = router;