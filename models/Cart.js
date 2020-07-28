var mongoose = require("mongoose");

var CartSchema = mongoose.Schema({
	total_items: Number,
	total_price: Number,
	items : [
		{
			 type: mongoose.Schema.Types.ObjectId,
			 ref: "Book"
		}
	],
});