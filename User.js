const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  address: { type: String },
  role: { type: String, default: "user" } // user or admin
});

module.exports = mongoose.model("User", userSchema);
