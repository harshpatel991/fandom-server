// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var Show = require('./models/show');
var Comment = require('./models/comment');
var Season = require('./models/season');
var Episode = require('./models/episode');
var User = require('./models/user');
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
  res.header("Access-Control-Allow-Credentials", true)
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT");

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

app.post('/api/change_password', passport.authenticate('local-changepass'), function(req, res) {
  console.log("POST to change password");
  res.status(201).json({message: 'Password changed'});
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

//------------------Get all Users------------------//
var usersRoute = router.route('/users');
usersRoute.get(function (req, res) {
  var query;
  //Retrieve all the possible query strings
  var sort = eval( "(" + req.query.sort + ")" );
  var select = eval( "(" + req.query.select + ")" );
  var skip = eval( "(" + req.query.skip + ")" );
  var limit = eval( "(" + req.query.limit + ")" );
  var count = eval( "(" + req.query.count + ")" );

  query = User.find();

  if(select)
    query.select(select);

  if(sort)
    query.sort(sort);

  if(skip)
    query.skip(skip);

  if(limit)
    query.limit(limit);

  if(count)
    query.count();

  //Execute DB query
  query.exec(function (err, users) {
    if(err)
      res.status(404).send({message: "Error: No Users Found", data: []});
    else
       res.status(200).json({message: "Ok", data: users});
  });
});

//------------------Get a Specific User------------------//
var specificUsersRoute = router.route('/users/:id');

specificUsersRoute.get(function (req, res) {
  User.findById(req.params.id, function (err, user) {
    if(!user)
      res.status(404).send({message: "Error: Invalid ID, No User Found", data: []});
    else
      res.status(200).json({message: "Ok", data: user});
  });
});

specificUsersRoute.put(function (req, res) {
  var userID = req.params.id;
  var favoriteArray = req.body.favorites;
  var upvoted = req.body.comments_upvoted;
  var downvoted = req.body.comments_downvoted;
  var episodesRatings = req.body.episodes_ratings;

  User.findById(userID, function (err, user) {
    if(!user)
      res.status(404).send({message: "Error: Invalid ID, No User Found", data: []});
    else {
      //Only update the arrays if one was passed in/defined
      if(favoriteArray !== undefined)
        user.favorites = favoriteArray;
      if(upvoted !== undefined)
        user.comments_upvoted = upvoted;
      if(downvoted !== undefined)
        user.comments_downvoted = downvoted;
      if(episodesRatings !== undefined)
        user.episodes_ratings = episodesRatings;

      //Save updated user to database
      user.save(function (err) {
        if(err)
          res.status(500).send({message: "Error: Database unable to update user", data: []});
        else
          res.status(200).json({message: "User updated", data: user});
      });
    }
  });
});

//------------------Get a Users Comments------------------//
var usersCommentsRoutes = router.route('/user_comments/:user_id');

usersCommentsRoutes.get(function(req, res){
  var sort = eval( "(" + req.query.sort + ")" );

  var userId = req.params.user_id;
  Comment.find({poster: userId},function(err,data){
    if(err){
      res.send({message:err.name,data:[]});
    }
    else{
      res.send({message:"Data retrieved",data:data})
    }
  });
});

//------------------Get a User's Favorite Shows------------------//
var userFavoritesRoute = router.route('/user_favorites/:user_id');

userFavoritesRoute.get(function (req, res) {
  User.findById(req.params.user_id, function (err, user) {
    if(!user)
      res.status(404).send({message: "Error: Invalid ID, No User Found", data: []});
    else {
      Show.find({'_id': { $in: user.favorites}}, function(err, shows){
        if (!shows){
          res.status(404).send({message: "Error: Invalid Show ID", data: []});
        }
        else{
          res.status(200).json({message: "Ok", data: shows});
        }
      });
    }
  });
});

//------------------show_comments------------------//
var show_comments_route = router.route('/show_comments/:ep_id');
//---get----//
show_comments_route.get(function(req, res){
  console.log("GET comments_downvoted");
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
  comment.posterName = req.body.posterName;
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
        res.send({message:"Data retrieved",data:data});
        data.save();
      }
  });
});


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

  if(select)
    query.select(select);

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

//------------------Get a Multiple Seasons using 'where' parameter------------------//
var multipleSeasonRoute = router.route('/seasons');

multipleSeasonRoute.get(function(req, res){

  var whereParam = eval("("+req.query.where+")");
  var sortParam = eval( "({air_date: 1})" );
  Season.find(whereParam).sort(sortParam).exec( function (err, seasons) {
    if(!seasons) {
      res.status(404).send({message: "Error: Invalid, No Seasons Found", data: []});
    }
    else {
      res.status(200).json({message: "Ok", data: seasons});
    }
  });
});

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

//------------------Get Multiple Episodes using 'where' parameter------------------//
var multipleEpisodeRotue = router.route('/episodes');

multipleEpisodeRotue.get(function (req, res) {
  var whereParam = eval("("+req.query.where+")");
  var sortParam = eval( "({air_date: 1})" );
  Episode.find(whereParam).sort(sortParam).exec(function (err, episodes) {
    if(!episodes) {
      res.status(404).send({message: "Error: Invalid, No Episodes Found", data: []});
    }
    else {
      res.status(200).json({message: "Ok", data: episodes});
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

specificEpisodeRotue.put(function (req, res) {

  var episodeID = req.params.id;
  //Rating Count is for the +/- of the rating count
  //Rating Star Count is for the +/- of the rating sum
  var ratingCount = req.body.count_rating;
  var ratingStarCount = req.body.star_rating;

  //See if Rating Count and Star Count are specified since they are required
  if(ratingCount === undefined || ratingStarCount === undefined) {
    res.status(500).send({message: "Error: Rating and Rating Star Count are required", data: []});
  }
  else {
    Episode.findById(episodeID, function (err, episode) {
      if(!episode) {
        res.status(404).send({message: "Error: Invalid ID, No Episode Found", data: []});
      }
      else{
        //Found the episode, now we need to update its rating_sum and rating_count
        console.log("before rating count: " + episode.rating_count);
        console.log("before rating value: " + episode.rating_sum);
        episode.rating_count += parseInt(ratingCount);
        episode.rating_sum += parseInt(ratingStarCount);

        console.log("rating count: " + episode.rating_count);
        console.log("rating value: " + episode.rating_sum);

        episode.save(function (err) {
          if(err) {
            res.status(500).send({message: "Error: Database unable to update episode", data: []});
          }
          else
            res.status(200).json({message: "Ok: Episode updated", data: episode});
        });
      }
    });
  }
});

// Start the server
app.listen(port);
console.log('Server running on port ' + port); 