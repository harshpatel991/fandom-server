// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var EpisodeSchema   = new mongoose.Schema({
  _id: Number,
  air_date: Date,
  episode_number: Number,
  imdb_rating: Number,
  img_url: String,
  name: String,
  season_number: Number,
  show_id: Number,
  summary: String,
  rating_sum: { type: Number, default: 0},
  rating_count: { type: Number, default: 0}
});

// Export the Mongoose model
module.exports = mongoose.model('Episode', EpisodeSchema);