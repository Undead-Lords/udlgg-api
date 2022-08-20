//External Libraries
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const bodyParser = require("body-parser");
//Express Handler
const api = express();

//Express Configuration
require("dotenv").config()
const port = 8001 //api.udl.gg addy
const ip = "0.0.0.0"
api.listen(port, ip)
api.set("trust proxy", 1)
console.log(
  `Starting API in the ${process.env.NODE_ENV ||
    "development(?)"} environment at ${ip}:${port}!`
)

//Express Middleware
api.use(bodyParser.urlencoded({ extended: false }))
api.use(bodyParser.json())

//Express Security Configuration
api.use(cors({ origin: "*", methods: "GET,POST" }))
api.use(compression())
api.use(helmet())
api.use(
  helmet.referrerPolicy({
    policy: "no-referrer-when-downgrade"
  })
)
api.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"]
    }
  })
)

//load routes
let home = require("./routes/home")
let chat = require("./routes/chat")
let gaming = require("./routes/gaming")
let members = require("./routes/members")
let traffic = require("./routes/traffic")
let timeline = require("./routes/timeline")
let update = require("./routes/update")
let voice = require("./routes/voice")

//use routes
api.use("/members", members)
api.use("/traffic", traffic)

api.use("/activity/chat", chat)
api.use("/activity/gaming", gaming)
api.use("/activity/voice", voice)

api.use("/timeline", timeline)
api.use("/update", update)
api.use("/", home)
