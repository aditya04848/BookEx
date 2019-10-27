var express = require("express");
var app = express();
//var mongoose = require("mongoose");
//mongoose.connect("mongodB://localhost/cat-app");
app.use(express.static("assets"));
app.set('view engine', 'ejs');

//======= ROUTES =======	 
//Landing
app.get('/', function(req, res){
	res.render('landingPage');
});
// Sign Up
app.get('/signup', function(req,res){
	res.render('signUpPage');
});
// Sign In
app.get('/signin', function(req,res){
	res.render('signInPage');
});
// Log Out
app.get('/signout', function(req,res){
	res.send("thank you!!");
});
// Main
app.get('/main', function(req,res){
	res.render('mainPage');
});
//====== END OF ROUTES ===== 
//start server
app.listen(3000, function(){
	console.log("Server is listening!!");
});