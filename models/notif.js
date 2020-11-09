var mongoose = require('mongoose');

var notifSchema = new mongoose.Schema({
	content: String,
	seen: {type: Boolean, default: false}
});

notifSchema.statics.findOrCreate = require("find-or-create");

module.exports = mongoose.model('notif', notifSchema);