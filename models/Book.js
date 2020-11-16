var mongoose = require('mongoose');

var BookSchema=new mongoose.Schema({
	title: String,
	author: String,
	price: Number,
	description: String,
	image : String,
	imageId: String,
	uploader : String,
	is_display: {type: Boolean, default: false},
	branch: String,
	// comments: [
	// 	{
	// 		 type: mongoose.Schema.Types.ObjectId,
	// 		 ref: "Comment"
	// 	}
	// ],
	ratings: [
		{
			 type: mongoose.Schema.Types.ObjectId,
			 ref: "Rating"
		}
	],
	rating: { type: Number, default: 0 }
});

BookSchema.statics.findOrCreate = require("find-or-create");

module.exports = mongoose.model('Book', BookSchema);