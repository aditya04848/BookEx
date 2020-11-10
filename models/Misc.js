var mongoose = require('mongoose');

var MiscSchema = new mongoose.Schema({
	title: String,
	description: String,
    image : String,
    imageId: String,
    uploader : String,
	author: {type: String, default: ""},
	price: String,
    ratings: [
        {
             type: mongoose.Schema.Types.ObjectId,
             ref: "Rating"
        }
    ],
    rating: { type: Number, default: 0 }
});

MiscSchema.statics.findOrCreate = require('find-or-create');
module.exports = mongoose.model('Misc', MiscSchema);