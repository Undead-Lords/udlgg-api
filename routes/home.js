require('dotenv').config();
const express = require('express')
const router = express.Router()

const pg = require('pg')
let pgsql = new pg.Client({
  host: 'localhost',
  user: process.env.DBUSER,
  database: process.env.DBNAME,
  password: process.env.DBPASS
})

// define the home page route
router.get('/', async function (req, res) {
    res.status(200).send("All Souls Are For Myrkul.");
})

//search route
router.get('/:id', async function (req, res) {
  if(req.params.id) {
    let shortcode = req.params.id.toLowerCase().replace(/[^A-Za-z0-9]+/, "").trim()
    const query = {
      text: 'SELECT * FROM udlgg WHERE udl_shortcode = $1 LIMIT 1',
      values: [shortcode]
    }
    await pgsql.connect()
    .then(client => {
      client.query(query)
      .then(res => {
        client.release()
        if(res && res.rows && res.rows.length == 1){
          res.status(200).send(res.rows[0])
        } else {
          res.status(404).send(`No results found for ${req.params.id}!`)
        }
      })
      .catch(e => {
        client.release()
        console.log(e.stack)
        res.status(404).send(`Error. No results found!`)
      })
    })
    .catch(e => {
      client.release()
      console.log(e.stack)
      res.status(404).send(`Error. No results found!`)
    })
  }
})

module.exports = router;
