var mongoose = require('mongoose');

var MiscSchema = new mongoose.Schema({
	title: String,
	description: String,
    image : String,
    imageId: String,
    uploader : String,
	is_display: {type: Boolean, default: false},
	price: Number,
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