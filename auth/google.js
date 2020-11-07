var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20');
var User = require('../models/User');

passport.serializeUser(function(User, done) {
  done(null, User);
});

passport.deserializeUser(function(User, done) {
  done(null, User);
});

passport.use(new GoogleStrategy({
    clientID: "921117793019-6r4on28a2c1j8a6tf95ogmp82cpqi7jj.apps.googleusercontent.com",
    clientSecret: "M3uhkGt4D8RcBQNPUQ0vIROf",
    callbackURL: "http://book-exchnge.herokuapp.com/signup/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
	console.log(refreshToken);
       User.findOrCreate({ username: profile._json.email }, { 
           accessToken: accessToken,
		   refreshToken: refreshToken,
		   username: profile._json.email,
		   firstname: profile._json.given_name,
		   lastname: profile._json.family_name,
		   userid: profile.id}, function (err, user) {
         return done(err, user);
       });
  }
));

module.exports = passport;