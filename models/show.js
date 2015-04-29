// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var ShowSchema   = new mongoose.Schema({
  id: Number,
  cast: [String],
  first_date: Date,
  genres: [String],
  imdb_id: String,
  imdb_rating: Number,
  img_filename: String,
  keywords: [String],
  last_date: Date,
  name: String,
  networks: [String],
  num_eps: Number,
  num_seasons: Number,
  remote_img_url: String,
  seasons: [Number],
  summary: String
});

// Export the Mongoose model
module.exports = mongoose.model('Show', ShowSchema);