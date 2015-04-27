var mongoose = require('mongoose');

// Define our beer schema
var ShowSchema   = new mongoose.Schema({
  content: String,
  assignedShow: String,
  assignedComment: String,
  postedBy: String
});

// Export the Mongoose model
module.exports = mongoose.model('Comment', LlamaSchema);