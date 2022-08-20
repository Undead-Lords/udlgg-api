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
    let results = await getTraffic(database);
    if (results) {
        res.status(200).send(results);
    } else {
        res.status(404).send(`No results were returned.`);
    }
});

module.exports = router;

async function getTraffic(database) {
    return new Promise(async (resolve, reject) => {
        let results;
        try {
            results = await database
            .query({
            text:
                "SELECT id, userid, rank, event_timestamp, event_type FROM public.udl_immigration ORDER BY event_timestamp DESC",
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