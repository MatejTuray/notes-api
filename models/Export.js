const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let uniqueValidator = require("mongoose-unique-validator");
const ExportSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    default: "one-time"
  },
  verified: {
    type: Boolean,
    default: false
  },
  data: {
    type: Schema.Types.Mixed,
    default: []
  },
  expiresAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 }
});

mongoose.model("exports", ExportSchema);
