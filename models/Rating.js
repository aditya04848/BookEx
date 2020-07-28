var mongoose = require("mongoose");

var ratingSchema = new mongoose.Schema({
    text: String,
    createdAt: { type: Date, default: Date.now },
	rating: Number,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String,
		firstname: String,
		lastname: String
	}
});

module.exports = mongoose.model("Rating", ratingSchema);