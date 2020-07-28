var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;
var User = require('../models/User');

passport.use(new FacebookStrategy({
    clientID: "603820383504147",
    clientSecret: "a2f9640c19affae56d223ea924bc6e17",
    callbackURL: "https://kitab-buddy.run-us-west2.goorm.io/signup/facebook/callback",
	profileFields: ['id', 'displayName','email'],
    enableProof: true
  },
  function(accessToken, refreshToken, profile, done) {
	User.findOrCreate({ username: profile._json.email }, { 
		username: profile._json.email,
		firstname: profile.displayName.split(" ")[0],
		lastname: profile.displayName.split(" ")[profile.displayName.split(" ").length - 1],
		userid: profile.id 
	}, function (err, user) {
	return done(err, user);
	});
  }
));

module.exports = passport;