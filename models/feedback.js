var mongoose = require('mongoose');

var feedSchema = new mongoose.Schema({
	name: String,
	content: String
});

feedSchema.statics.findOrCreate = require('find-or-create');
module.exports = mongoose.model('Feed', feedSchema);