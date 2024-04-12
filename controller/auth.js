var jwt = require("jsonwebtoken");
const User = require("../model/user");
const Otp = require("../model/otp");
const crypto = require('crypto');
const { secret } = require("../config/var");
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");

exports.signIn = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		// Email is not in DB
		if (!user || user === null)
			return res.status(400).json({ error: "Email not exist" });
		// Wrong password
		if (!user.authenticate(password))
			return res.status(400).json({ error: "Wrong Password" });
		user.encry_password = undefined;
		user.salt = undefined;
		const token = jwt.sign({ _id: user._id }, secret);
		res.cookie("token", token, { expire: new Date() + 9999 });
		return res.json({ user, token });
	} catch (err) {
		return res.status(400).json({ error: "Failed to Signin" });
	}
};

exports.signUp = async (req, res, next) => {
	try {
		const { step } = req.params;
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		if (step == 1) {
			const { email } = req.body;
			const already = await User.findOne({email});
			if(already) {
				return res.status(400).json({error : "email is already registered"});
			}
			const code = getCode();
			await Otp.findOneAndUpdate(
				{ email },
				{ otp: code },
				{ new: true, upsert: true },
			);
			await sendOtptoMail(code ,email ,req.body.name);
			return res.json({msg : "Otp has been sent to email  please verify it"});
		} else if (step == 2) {
			const {otp , email,password,name} = req.body;
			if(otp == null ||otp == undefined) return res.json({ error: "Otp is required" });

			const data = await Otp.findOneAndDelete({email ,otp});					
			if(!data) return res.json({ error: "Invalid Otp" });
			const user = new User({name , email,password});
			user.save((err, data) => {
				if (err)
					return res
						.status(400)
						.json({ error: "Failed to save user in DB" });
				return res.json({
					_id: data._id,
					email: data.email,
					name: data.name,
				});
			});
		} else return res.json({ error: "Failed to Signup" });
	} catch (err) {
		console.log(err);
		return res.json({ error: "Failed to Signup" });
	}
};

exports.signOut = (req, res, next) => {
	res.clearCookie("token");
	return res.status(200).json({ msg: "User Sign out successfully" });
};

const sendOtptoMail = async(otp , email,name) => {
	try {
		var transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: "amit.dev.nit@gmail.com",
				pass: "yqct fxay micf qeas",
			},
		});
		var info = {
			from: '"Eflyer 👻" <amit.dev.nit@gmail.com>',
			to: email,
			subject: "verify your account",
			html: `<h3>Hi ${name},</h3> <p>Your code for account verification is ${otp}</a>`,
		};
		const response = await transporter.sendMail(info);
		return response;
	} catch (err) {
		// console.log(err);
		return err;
	}
}

const getCode =() => {
	const randomString = crypto.randomBytes(8).toString('hex');
  	const hash = crypto.createHash('sha256').update(randomString).digest('hex');
  	const code = hash.substring(0, 6);
  	return code;
}
