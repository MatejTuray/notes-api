const mongoose = require("mongoose")
const Schema = mongoose.Schema
let uniqueValidator = require('mongoose-unique-validator');
const NoteSchema = new Schema({

    key: {
        type: String,
        required: true,
        
    },
    date: {
        type: Number
    },
    list: [],
    title: {type: String},
    text: {type: String},
    remind: {type: Boolean, default: false,},
    reminderDate: {type: String},
    color: {type: String},
    star: {type: Boolean, default: false},
    archive: {type: Boolean, default: false},
    totalPrice: {type: Number},
    expiresAt: { type: Date, default: Date.now, expires: 60*60*24*7}

})

mongoose.model("notes", NoteSchema);

// key: this.state.key,
// date: Date.parse(this.state.date),
// title: this.props.title,
// text: this.state.text,
// remind: this.state.remind,
// reminderDate: this.state.reminderDate,
// color: this.state.color,
// star: false,
// archive: false,