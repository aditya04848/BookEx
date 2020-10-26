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
    clientID: "1040941249609-oscm85g83ueshgs930pvncpsdmdcif6e.apps.googleusercontent.com",
    clientSecret: "bcNyHqPiFtsXUpTDUwme213T",
    callbackURL: "https://kitab-buddy.run-us-west2.goorm.io/signup/google/callback"
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