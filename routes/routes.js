const express = require("express");
const app = express();
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const env = require("../configTest").env;
require("../models/Note");
require("../models/Export");
const path = require("path");
const publicPath = path.join(__dirname);
const Note = mongoose.model("notes");
const Links = mongoose.model("links");
const Export = mongoose.model("exports");
const validate = require("uuid-validate");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const uuid = require("uuid").v4;
const EmailValidator = require("email-deep-validator");
const url = require("url");
const redis = require("redis");
const redisURL = url.parse(process.env.REDISCLOUD_URL);

// TODO Docs
if (env === "dev" || env === "test") {
  redisURL.port = process.env.REDIS_PORT;
  redisURL.hostname = process.env.REDIS_HOST;
}
const client = redis.createClient(
  redisURL.port,
  redisURL.hostname,
  { auth_pass: process.env.REDIS_PASSWORD },
  {
    no_ready_check: true
  }
);
// client.flushall((err, reply) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(reply);
//   }
// });
const cache = require("express-redis-cache")({
  client: client
});
console.log(redisURL);
const generate = ex =>
  jwt.sign({ id: ex.key }, process.env.JWT_SECRET, { expiresIn: "7d" });
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "noreply.notes.api@gmail.com",
    pass: process.env.MAIL_PASS
  }
});

module.exports = app => {
  // IMPORT DATA
  app.get("/api/import/:ekey", (req, res) => {
    let ekey = req.params.ekey;
    if (!ekey) {
      return res.status(400).send({ reponse: "No ID provided" });
    } else if (validate(req.params.ekey, 4)) {
      Export.findOne({ key: ekey })
        .then(exp => {
          if (exp) {
            res.status(200).send(exp);
          } else {
            res
              .status(404)
              .send({ response: "Unable to resolve request, data not found" });
          }
        })
        .catch(e => console.log(e));
    }
  });
  // DELETE ONE-TIME EXPORTS
  app.delete("/api/import/:ekey", (req, res) => {
    let ekey = req.params.ekey;
    Export.deleteOne({ key: ekey })
      .then(exp => {
        if (exp) {
          res.send({ response: "Deleted" });
        } else {
          console.log(err);
        }
      })
      .catch(e => console.log(e));
  });

  // EXPORT DATA AND GENERATE QR
  app.post("/api/export", (req, res) => {
    const emailValidator = new EmailValidator();
    let result;
    const validateMail = async () => {
      result = await emailValidator.verify(req.body.email);
      return result;
    };
    validateMail()
      .then(valid => {
        if (valid.validDomain && valid.validMailbox && valid.wellFormed) {
          if (validate(req.body.key, 4)) {
            let newExport = new Export({
              key: req.body.key,
              email: req.body.email,
              date: req.body.duration,
              data: req.body.data,
              type: req.body.type,
              expiresAt: req.body.duration
            });
            newExport.save().then(ex => {
              res.status(200).send({ response: "Export successful" });
              if (ex) {
                let token = generate(ex);
                try {
                  transporter.sendMail({
                    from: "noreply.notes.api@gmail.com",
                    to: ex.email,
                    subject: "Export údajov z aplikácie Môj Notes",
                    html: `<h4>Vážený užívateľ, na tento mail prosím neodpovedajte, bol vygenerovaný automaticky. Priložený link obsahuje QR kód ktorý po oskenovaní importuje Vaše exportované údaje do ďalšieho zariadenia s aplikáciou Môj Notes. Odkaz je platný len po dobu ktorú ste určili pri exporte v aplikácii.</h4>

                    <a href="https://react-native-notesapi.herokuapp.com/api/export/verify/?token=${token}">https://react-native-notesapi.herokuapp.com/api/export/verify/?token=${token}</a>`
                  });
                } catch (e) {
                  console.log(e);
                  transporter.sendMail({
                    from: "noreply.notes.api@gmail.com",
                    to: ex.email,
                    subject: "Export údajov z aplikácie Môj Notes",
                    html: `
                    <h4>Vážený užívateľ, na tento mail prosím neodpovedajte, bol vygenerovaný automaticky. Priložený link obsahuje QR kód ktorý po oskenovaní importuje Vaše exportované údaje do ďalšieho zariadenia s aplikáciou Môj Notes. Odkaz je platný len po dobu ktorú ste určili pri exporte v aplikácii.</h4>
                    <a href="https://react-native-notesapi.herokuapp.com/api/export/verify/?token=${token}">https://react-native-notesapi.herokuapp.com/api/export/verify/?token=${token}</a>`
                  });
                }
              }
            });
          } else {
            res.status(400).send({ response: "Invalid key" });
          }
        } else {
          res.status(400).send({ response: "Invalid e-mail address provided" });
        }
      })
      .catch(e => console.log(e));
  });
  app.get("/api/export/verify/", (req, res) => {
    let token = req.query.token;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          res.status(401).send({ response: "Invalid token" });
        } else {
          Export.findOne({ key: decoded.id }).then(ex => {
            if (ex) {
              Export.updateOne(
                { key: decoded.id },
                { $set: { verified: true } }
              ).then(updated => {
                if (updated) {
                  res.redirect(`/export/${decoded.id}`);
                } else {
                  res.status(400).send({ response: "Error" });
                }
              });
            } else {
              res.status(404).send({ response: "Not found" });
            }
          });
        }
      });
    }
  });
  //PRIVACY POLICY
  app.get("/privacy-policy", (req, res) => {
    res.sendFile(path.join(publicPath, "..", "/privacy_policy.html"));
  });

  // SAVE NOTE FOR SHARING
  app.post("/api/note", (req, res) => {
    if (validate(req.body.key, 4)) {
      let newNote = new Note({
        key: req.body.key,
        date: req.body.date,
        title: req.body.title,
        text: req.body.text,
        remind: req.body.remind,
        reminderDate: req.body.reminderDate,
        color: req.body.color
      });
      newNote
        .save()
        .then(note => res.status(200).send(note))
        .catch(err => res.status(400).send({ error: err }));
    } else {
      res.status(400).send({ response: "Invalid key" });
    }
  });
  app.post("/api/list", (req, res) => {
    if (validate(req.body.key, 4)) {
      let newNote = new Note({
        key: req.body.key,
        date: req.body.date,
        title: req.body.title,
        list: req.body.list,
        remind: req.body.remind,
        reminderDate: req.body.reminderDate,
        color: req.body.color,
        totalPrice: req.body.totalPrice
      });
      newNote
        .save()
        .then(note => res.status(200).send(note))
        .catch(err => res.status(400).send({ error: err }));
    } else {
      res.status(400).send({ response: "Invalid key" });
    }
  });
  app.get("/export/:id", (req, res) => {
    res.sendFile(path.join(publicPath, "..", "export/redirect.html"));
  });

  // GET NOTE BY UUID
  app.get("/api/items/:key", (req, res) => {
    /**
     * @route GET /items/:key
     * @returns {object} 200 - returns a note or a shopping list with given uuid
     * @returns {Error}  default - Unexpected error
     */
    let key = req.params.key;
    if (!key) {
      return res.status(400).send({ response: "Invalid ID format" });
    } else if (validate(key, 4)) {
      Note.findOne({ key: key })
        .then(note => {
          if (note) {
            res.status(200).send(note);
          } else {
            res.status(404).send({ response: "Unable to resolve request" });
          }
        })
        .catch(e => console.log(e));
    }
  });

  // DELETE NOTE BY UUID
  app.delete("/api/items/:key", (req, res) => {
    let key = req.params.key;
    if (validate(key, 4) === false) {
      return res.status(400).send({ response: "Invalid ID format" });
    } else {
      Note.findOneAndRemove({ key: req.params.key })
        .then(note => {
          if (note) {
            res.status(200).send({ response: "Deleted" });
          } else {
            res.status(404).send({ response: "Unable to resolve request" });
          }
        })
        .catch(e => console.log(e));
    }
  });
  //AKTUALNE LETAKY SCRAPER
  app.get("/api/letaky", cache.route({ expire: 60 * 60 * 10 }), (req, res) => {
    /**
     * @route GET /letaky
     * @returns {object} 200 - Latest specific slovakian flyers
     * @returns {Error}  default - Unexpected error
     */
    Links.findOne()
      .sort({ $natural: -1 })
      .limit(1)
      .exec(function(err, links) {
        //fetch latest one
        if (links) {
          res.status(200).send(links);
        } else if (err) {
          res.status(404).send({ response: err });
        }
      });
  });
};
