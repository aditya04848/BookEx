var mongoose = require('mongoose');

var eBookSchema = new mongoose.Schema({
	title: String,
	author: String,
	description: String,
	uploader: String,
	price: String,
	file_id: String,
	is_display: {type: Boolean, default: false},
	branch: String,
	tag: String,
	ratings: [
		{
			 type: mongoose.Schema.Types.ObjectId,
			 ref: "Rating"
		}
	],
	rating: { type: Number, default: 0 }
});

eBookSchema.statics.findOrCreate = require('find-or-create');
module.exports = mongoose.model('EBook', eBookSchema);