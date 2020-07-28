var mongoose = require('mongoose'),
    passportLocalMongoose	= require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
	username: { type: String, unique:true, lowercase: true },
	password: String,
	firstname : String,
	lastname : String,
	mobileno : String,
	city : String,
	college : String,
  	userid: String,
	otp: Number,
	isVerified: {type: Boolean, default: false},
  	updated_at: { type: Date, default: Date.now }, 
	cart : [{
		type: mongoose.Schema.Types.ObjectId,
		ref : "Book"
	}],
	cart_items: {type: Number, default: 0},
	total_price: {type: Number, default: 0}
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.statics.findOrCreate = require("find-or-create");


module.exports = mongoose.model('User', UserSchema);