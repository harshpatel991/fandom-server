// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var Llama = require('./models/llama');
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






// Start the server
app.listen(port);
console.log('Server running on port ' + port); 