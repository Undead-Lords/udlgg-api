require("dotenv").config();
const express = require("express");
const router = express.Router();
const fs = require("fs")
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
  let results = false;
  if (results) {
    res.status(200).send(results);
  } else {
    res.status(404).send(`Error.`);
  }
});

router.get("/update", async function(req, res) {
  let results = false;
  //require the library, main export is a function
  const simpleGit = require('simple-git');
  const git = simpleGit(process.cwd());
  try{
    if(!fs.existsSync('timeline')) {
      console.log("UDL Timeline didn't exist, creating it...")
      await git.clone('https://github.com/Undead-Lords/udl-history', './timeline', null)
        .cwd('./timeline').reset(['--hard']);
      await jsonLoader(process.cwd() + '/timeline/events/')      
      res.status(200).send("UDL Timeline Initialized. Praise Myrkul!");
    } else {
      console.log("UDL Timeline exists, updating it...")
      await git.cwd('./timeline').pull().reset(['--hard']);
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
  console.log("Loading UDL Timeline... ");
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
          //console.log(currentPath + '/' + files[i], jsonData)
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