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
  //require the library, main export is a function
  const simpleGit = require('simple-git');
  const git = simpleGit(process.cwd());
  try{
    if(!fs.existsSync('timeline')) {
      console.log("UDL Timeline didn't exist, creating it...")
      await git.clone('https://github.com/Undead-Lords/udl-history', './timeline', null)
        .cwd('./timeline').reset(['--hard']);
      console.log("Loading UDL Timeline into Database... ");
      await jsonLoader(process.cwd() + '/timeline/events/')      
      await purgeTimeline()
      res.status(200).send("UDL Timeline Initialized. Praise Myrkul!");
    } else {
      console.log("UDL Timeline exists, updating it...")
      await git.cwd('./timeline').pull().reset(['--hard']);
      console.log("Loading UDL Timeline into Database... ");
      //delete all events
      await purgeTimeline()
      //load in all events from repository
      await jsonLoader(process.cwd() + '/timeline/events/')      
      res.status(200).send("UDL Timeline Updated. Praise Myrkul!");
    } 
  }
  catch (e) {
    res.status(404).send(`UDL Timeline failed at updating.`)
    console.error("UDL Timeline update error: ", e)
  }
});

module.exports = router;

async function jsonLoader(currentPath) {
  console.log("Reading Events from...", currentPath);
  var files = fs.readdirSync(currentPath);
  for (let i in files) {
    let currentFile = currentPath + "/" + files[i];
    let stats = await fs.statSync(currentFile);
    if (stats.isFile() && currentFile.includes(".json")) {
      let jsonData = {}
      let readFile =  await fs.readFileSync(currentFile)
      if (!readFile) { 
         console.error("Error Reading File:", currentFile, err) 
      } 
      else {
        try {
          jsonData = JSON.parse(readFile)
          console.log("Adding Event...", jsonData.eventName)
          await loadEvent(jsonData)
        } catch (err) {
          console.error("JSON Syntax Error Detected In:", currentPath + '/' + files[i], err)
        }
      }
    } else if (stats.isDirectory()) {
      jsonLoader(currentFile);
    }
  }
  return new Promise(async (resolve, reject) => {
    resolve(true);
  });
}

async function loadEvent(eventJSON){
  return new Promise(async (resolve, reject) => {
    let results;
    let customID = eventJSON.eventName.toLowerCase().split(' ').join("-")
    let startDate = await eventJSON.eventStartDate ? dayjs(eventJSON.eventStartDate, "MM-DD-YYYY").format('YYYY-MM-DD 00:00:00') : dayjs("1800-01-01", "YYYY-MM-DD").format('YYYY-MM-DD 00:00:00')
    let endDate = await eventJSON.eventEndDate && eventJSON.eventEndDate != "" ? dayjs(eventJSON.eventEndDate, "MM-DD-YYYY").format('YYYY-MM-DD 00:00:00') : startDate
      try { 
        results = await database
           .query({
              text: "INSERT INTO udl_timeline (id, event_name, event_type, event_start, event_end, event_short_description, event_long_description, associated_knights, associated_games) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
              values: [customID, eventJSON.eventName, eventJSON.eventType, startDate, endDate, eventJSON.eventShortDescription, eventJSON.eventLongDescription, eventJSON.associatedKnights.join(", "), eventJSON.associatedGames.join(", ")]
            })
          .catch(e => console.log(e));
      } catch (e) {
        console.error(e);
      }
    if (results && results.rowCount==1 && results.command=="INSERT") {
      resolve(true);
    } else {
      console.log(results)
      resolve(false);
    }
  })
}

async function purgeTimeline(){
  return new Promise(async (resolve, reject) => {
    let results;
      try {
        results = await database
          .query({
            text:
              "DELETE FROM public.udl_timeline",
            values: []
          })
          .catch(e => console.log(e));
      } catch (e) {
        console.error(e);
      }
    if (results.rowCount==0) {
      resolve(true);
    } else {
      resolve(false);
    }
  })
}

