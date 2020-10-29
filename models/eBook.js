var mongoose = require('mongoose');

var eBookSchema = new mongoose.Schema({
	title: String,
	author: String,
	description: String,
	uploader: String,
	is_display: {type: Boolean, default: false}
});

eBookSchema.statics.findOrCreate = require('find-or-create');
module.exports = mongoose.model('EBook', eBookSchema);