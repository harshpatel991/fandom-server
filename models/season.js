// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var SeasonSchema   = new mongoose.Schema({
  air_date: Date,
  episodes: [Number],
  name: String,
  season_number: Number,
  show_id: Number,
  summary: String
});

// Export the Mongoose model
module.exports = mongoose.model('Season', SeasonSchema);