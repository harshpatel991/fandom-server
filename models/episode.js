// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var EpisodeSchema   = new mongoose.Schema({
  air_date: Date,
  episode_number: Number,
  imdb_rating: Number,
  img_url: String,
  name: String,
  season_number: Number,
  show_id: Number,
  summary: String,
  rating_sum: Number,
  rating_count: Number
});

// Export the Mongoose model
module.exports = mongoose.model('Episode', EpisodeSchema);