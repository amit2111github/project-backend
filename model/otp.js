var mongoose = require('mongoose');

var otpSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			trim: true,
			required: true,
			unique: true,
		},
		otp : {
			type :String,
			trim : true,
			required : true
		}
	},
	{ timestamps: true }
);
module.exports = mongoose.model('Otp', otpSchema);
