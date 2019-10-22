require('dotenv').config();
const express = require('express')
const router = express.Router()

const pg = require('pg')
let pool = new pg.Pool({
  host: 'localhost',
  user: process.env.DBUSER,
  database: process.env.DBNAME,
  password: process.env.DBPASS,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
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
    await pool.connect()
    .then(client => {
      client.query(query)
      .then(results => {
        if(results && results.rows && results.rows.length == 1){
          //increment visitor count
          let now = new Date()
          let incrementVisitor = {
            text: 'UPDATE udlgg SET udl_visitors = udl_visitors + 1, udl_last_visited = $1 WHERE udl_shortcode = $2',
            values: [now, shortcode]
          }
          client.query(incrementVisitor)
          .catch(e=> {
            console.log(e.stack);
          })
          //end increment visitor counter
          res.status(200).send(results.rows[0])
        } else {
          res.status(404).send(`No results found for ${req.params.id}!`)
        }
      })
      .catch(e => {
        console.log(e.stack)
        res.status(404).send(`pgSQL Failure. No results found!`)
      })
      .then(() => client.release())
    })
    .catch(e => {
      console.log(e.stack)
      res.status(404).send(`pgSQL Failure. No results found!`)
    })
  }
})

module.exports = router;
