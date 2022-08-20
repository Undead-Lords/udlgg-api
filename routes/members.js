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
    let results = await getMembers(database);
    if (results) {
        res.status(200).send(results);
    } else {
        res.status(404).send(`No results were returned.`);
    }
});

module.exports = router;

async function getMembers(database) {
    return new Promise(async (resolve, reject) => {
        let results;
        try {
            results = await database
            .query({
            text:
                "SELECT member_id, member_rank, last_online, active, privacy, CASE privacy WHEN 1 THEN CONCAT('Anonymous Knight ', RANK() OVER (ORDER BY member_id)) ELSE member_name END member_name FROM public.udl_roster WHERE NOT active = false",
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