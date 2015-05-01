// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var Show = require('./models/show');
var Comment = require('./models/comment');
var Season = require('./models/season');
var Episode = require('./models/episode');
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
  res.status(200).json({
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

  res.status(403).json({
    error: "User not logged in"
  });
}


//------------------show_comments------------------//
var show_comments_route = router.route('/show_comments/:ep_id');
//---get----//
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

//---post---//
show_comments_route.post(function(req, res){
  var comment = new Comment();
  comment.episode_id = req.params.ep_id;
  if(req.body.parent_id){
    comment.parent_id = req.body.parent_id;
  }

  comment.poster = req.body.poster;
  comment.post_time = req.body.post_time;
  comment.text = req.body.text;

  comment.save();
  res.send({message:"created", data:comment});
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


//------------------delete_comments------------------//
var delete_comments_route = router.route("/delete_comments/:comment_id");
delete_comments_route.delete(function(req, res){
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

//------------------Get All Shows------------------//
var showRoute = router.route('/shows');

showRoute.get(function(req, res){
  var query;
  //Retrieve possible query strings
  var select = eval( "(" + req.query.select + ")" );
  var sort = eval( "(" + req.query.sort + ")" );
  var skip = eval( "(" + req.query.skip + ")" );
  var limit = eval( "(" + req.query.limit + ")" );
  var count = eval( "(" + req.query.count + ")" );

  query = Show.find();

  if(sort)
    query.sort(sort);

  if(skip)
    query.skip(skip);

  if(limit)
    query.limit(limit);

  if(count)
    query.count();

  //Execute DB query
  query.exec(function (err, shows) {
    if(err)
      res.status(500).send({message: "Error: Unable to retrieve Shows", data: []});
    else
      res.status(200).json({message: "Ok", data: shows});
  });
});

//------------------Get Specific Show------------------//
var specificShowRoute = router.route('/shows/:id');

specificShowRoute.get(function(req, res){
  console.log(req.params.id);
  Show.findById(req.params.id, function (err, show) {
    if(!show) {
      res.status(404).send({message: "Error: Invalid ID, No Show Found", data: []});
    }
    else {
      res.status(200).json({message: "Ok", data: show});
    }
  });
});

//------------------Get a Specific Season------------------//
var specificSeasonRoute = router.route('/seasons/:id');

specificSeasonRoute.get(function(req, res){
  Season.findById(req.params.id, function (err, season) {
    if(!season) {
      res.status(404).send({message: "Error: Invalid ID, No Season Found", data: []});
    }
    else {
      res.status(200).json({message: "Ok", data: season});
    }
  });
});

//------------------Get a Specific Episode------------------//
var specificEpisodeRotue = router.route('/episodes/:id');

specificEpisodeRotue.get(function (req, res) {
  Episode.findById(req.params.id, function (err, episode) {
    if(!episode) {
      res.status(404).send({message: "Error: Invalid ID, No Episode Found", data: []});
    }
    else {
      res.status(200).json({message: "Ok", data: episode});
    }
  });
});

// Start the server
app.listen(port);
console.log('Server running on port ' + port); 