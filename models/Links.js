const mongoose = require("mongoose")
const Schema = mongoose.Schema
let uniqueValidator = require('mongoose-unique-validator');
const LinkSchema = new Schema({
    list: [],
    date: {type: Number, default: Date.parse(new Date())},
    expiresAt: { type: Date, default: Date.now, expires: 60*60*24*7 }


})

mongoose.model("links", LinkSchema);