const mongoose = require("mongoose");
const { ObjectId } = mongoose;

const { Schema } = mongoose;

const futureMessage = new Schema(
	{
		description: {
			type: String,
			required: true,
		},
		sender: {
			type: ObjectId,
			ref: "User",
			required: true,
		},
		receiver: {
			type: ObjectId,
			ref: "User",
			required: true,
		},
		time: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true },
);
module.exports = mongoose.model("Future", futureMessage);
