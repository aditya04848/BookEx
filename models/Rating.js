var mongoose = require("mongoose");

var ratingSchema = new mongoose.Schema({
    text: String,
    createdAt: { type: Date, default: Date.now },
	rating: Number,
	firstname: String,
	lastname: String
});

ratingSchema.statics.findOrCreate = require("find-or-create");

module.exports = mongoose.model("Rating", ratingSchema);