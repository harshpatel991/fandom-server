// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var Llama = require('./models/llama');
var Comment = require('./models/Comment');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var router = express.Router();

//replace this with your Mongolab URL
mongoose.connect('mongodb://fandom-user:password@dbh11.mongolab.com:27117/fandom');
require('./config/passport')(passport);

var app = express(); // Create our Express application

app.use(cookieParser());
app.use(bodyParser());

var port = process.env.PORT || 4000; // Use environment defined port or 4000

//Allow CORS so that backend and frontend could pe put on different servers
var allowCrossDomain = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept", "Access-Control-Allow-Origin");
  res.header("Allow-Credentials", true);
  res.header("Access-Control-Allow-Credentials", true);

  next();
};
app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({ // Use the body-parser package in our application
  extended: true
}));
app.use(session({ secret: 'passport demo' }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api', router); // All our routes will start with /api


// ===========START ROUTES===========
//Default route here
var homeRoute = router.route('/');

homeRoute.get(function(req, res) {
  res.json({ message: 'Hello World!' });
});

app.post('/api/signup', passport.authenticate('local-signup'), function(req, res) {
  console.log("POST to signup");
  res.status(201).json({message: 'Signed up'});
});

app.post('/api/login', passport.authenticate('local-login'), function(req, res) {
  console.log("POST to login");
  res.status(201).json({message: 'Logged in'});
});

app.get('/api/profile', isLoggedIn, function(req, res) {
  res.json({
    user: req.user
  });
});

app.get('/api/logout', function(req, res) {
  console.log("GET on logout");
  req.logout();
  res.status(201).json({message: 'Logged out'});
  console.log("Done logging out");
});

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated())
    return next();

  res.json({
    error: "User not logged in"
  });
}




//TODO: Add more routes here
//------------------show_comments------------------//
var show_comments_route = router.route('/show_comments/:ep_id');
show_comments_route.get(function(req, res){
  console.log("GET comments");
  var ep_id = req.params.ep_id;
  Comment.find({episode_id:ep_id},function(err,data){
    if(err){
      res.send({message:err.name,data:[]});
    }
    else{
      res.send({message:"Data retrieved",data:data})
    }
  });
});


//------------------comment_comments------------------//
var comment_comments_route = router.route('/comment_comments/:comment_id');
comment_comments_route.get(function(req, res){
  var comment_id = req.params.comment_id;
  Comment.find({parent_id: comment_id},function(err, data){
    if(err){
      res.send({message:err.name,data:[]});
    }
    else{
      res.send({message:"Data retrieved",data:data})
    }
  });
});


//------------------vote_comments------------------//
var vote_comments_route = router.route('/vote_comments/:comment_id');
vote_comments_route.put(function(req, res){
  //change ratings
  var comment_id = req.params.comment_id;
  var IncOrDec = req.body.IncOrDec;
  var condition = {_id: comment_id};
  
  Comment.findOne(condition,function(err, data){
    if(err){
        res.send({message:err.name,data:[]});
      }
      else{
        if(IncOrDec == "increase"){
           data.points += 1;
        }
        else{
          data.points -= 1;
        }
        res.send({message:"Data retrieved",data:data})
        data.save();
      }
  });
})


//------------------add_comments------------------//
var add_comments_route = router.route("/add_comments");
add_comments_route.post(function(req, res){
  //decide if it's a comment of show or comment of comments
  var comment = new Comment();
  if(req.body.episode_id){
    comment.episode_id = req.body.episode_id;
  }
  if(req.body.parent_id){
    comment.parent_id = req.body.parent_id;
  }

  comment.poster = req.body.poster;
  comment.post_time = req.body.post_time;
  comment.text = req.body.text;

  comment.save();
  res.send({message:"created", data:comment});
});


//------------------delete_comments------------------//
var delete_comments_route = router.route("/delete_comments/:comment_id");
delete_comments_route.delete(function(req, res){
  //delete all the children comments
  Comment.find({parent_id: req.params.comment_id},function(err, data){
    if(err){
      res.send({message:err.name,data:[]});
    }
    else{
      for(obj in data){
        Comment.remove({_id: data[obj]._id});
      }
    }
  });
  //delete itself
  Comment.remove({_id: req.params.comment_id},function(err, data){
    if(err){
      res.send({message:err.name,data:[]});
    }
    else{
      res.send({message:"Deleted",data:data});
    }
  });
});


// Start the server
app.listen(port);
console.log('Server running on port ' + port); 