const express = require("express");
const path = require("path");
require("dotenv").config();
const app = new express();
const publicPath = path.join(__dirname);
console.log(publicPath);
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const port = process.env.PORT || 5000;
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const mongoose = require("mongoose");
const env = require("./configTest").env;
const scraper = require("./scraper");
const rateLimit = require("express-rate-limit");
console.log("env:", env);

const compression = require("compression");
const passport = require("passport");
var responseTime = require("response-time");
require("./models/Note");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "noreply.notes.api@gmail.com",
    pass: process.env.MAIL_PASS
  }
});
transporter.sendMail({
  from: "noreply.notes.api@gmail.com",
  to: "matej.turay@gmail.com",
  html: `<p>Live!</p>`
});
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
const expressSwagger = require("express-swagger-generator")(app);

let options = {
  swaggerDefinition: {
    info: {
      description: "This is a sample server",
      title: "Swagger",
      version: "1.0.0"
    },
    host: "https://react-native-notesapi.herokuapp.com",
    basePath: "/api",
    produces: ["application/json"],
    schemes: ["https"],
    securityDefinitions: {
      JWT: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: ""
      }
    }
  },
  basedir: __dirname, //app absolute path
  files: ["./routes/routes.js"] //Path to the API handle folder
};
expressSwagger(options);
app.use(bodyParser.json());
app.use(cookieParser());
app.set("views", __dirname + "/views");
app.set("view engine", "jsx");
app.use(responseTime());
app.engine(
  "jsx",
  require("express-react-views").createEngine({ beautify: true })
);
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath));
app.use(cors());
app.enable("trust proxy");
app.use(cors());
app.use(compression());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again after an hour" // limit each IP to 100 requests per windowMs
});
app.use(limiter);
require("./routes/routes")(app);
scraper.scrape();
setTimeout(function() {
  console.log("minute");
  scraper.scrape();
}, 60000 * 60 * 24);

app.use(passport.initialize());
app.use(passport.session());
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});
app.listen(port, () => {
  console.log("server is up, port: ", port);
});
module.exports = { app };
