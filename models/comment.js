var mongoose = require('mongoose');

// Define our beer schema
var CommentSchema   = new mongoose.Schema({
  text: String,
  episode_id: {type: Number, default: -1},
  parent_id: {type: String, default: ""},
  poster: String,
  post_time: Date,
  points: {type: Number, default: 0}
});

// Export the Mongoose model
module.exports = mongoose.model('Comment', CommentSchema);