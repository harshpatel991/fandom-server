var mongoose = require('mongoose');

// Define our beer schema
var CommentSchema   = new mongoose.Schema({
  text: String,
  episode_id: Number,
  parent_id: {type: String, default: "-1"},
  poster: String,
  posterName: String,
  post_time: Date,
  points: {type: Number, default: 0}
});

// Export the Mongoose model
module.exports = mongoose.model('Comment', CommentSchema);