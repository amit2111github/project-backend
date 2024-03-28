const Message = require("../model/message");
const Future = require("../model/futuremessage");
const User = require("../model/user");
const schedule = require("node-schedule");
const moment = require("moment");
function getString(time) {
	const { year, month, day, hour, minute } = time;
	return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":00";
}
function addSchedule(timeObject, id) {
	const rule = new schedule.RecurrenceRule();
	const time = getString(timeObject);
	rule.tz = "Asia/Kolkata";
	rule.year = moment(time).year();
	rule.month = moment(time).month();
	rule.date = moment(time).date();
	rule.hour = moment(time).hours();
	rule.minute = moment(time).minutes();
	rule.second = moment(time).seconds();
	schedule.scheduleJob(rule, async function () {
		const futureMessage = await Future.findOne({ _id: id });
		await Future.deleteOne({ _id: id });
		console.log(futureMessage);
		const msg = {
			description: futureMessage.description,
			sender: futureMessage.sender,
			receiver: futureMessage.receiver,
		};
		const message = new Message(msg);
		await message.save();
	});
}
exports.sendMessage = async (req, res, next) => {
	try {
		const { forFuture } = req.body;
		if (forFuture) {
			const { time } = req.body;
			const msg = {
				description: req.body.description,
				sender: req.body.sender,
				receiver: req.body.receiver,
				time: getString(time),
			};
			let message = new Future(msg);
			message = await message.save();
			console.log(message);
			addSchedule(time, message._id);
			return res.json(message);
		} else {
			let message = new Message(req.body);
			message = await message.save();
			return res.json(message);
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({ err: "Failed to send Message" });
	}
};
// get All message of a user to seconde user
exports.getAllMessageOfUserOneToSecondUser = async (req, res, next) => {
	const { to } = req.params;
	try {
		const messages = await Message.find({
			$or: [
				{ sender: req.auth._id, receiver: to },
				{ sender: to, receiver: req.auth._id },
			],
		}).sort({
			createdAt: "asc",
		});
		return res.json(messages);
	} catch (err) {
		console.log(err);
		return res.status(400).json({ err: "Failed to fetch result" });
	}
};

exports.createContactForSecondUserIfnot = async (req, res, next) => {
	try {
		const { to } = req.params;
		const secondUser = await User.findById(to);
		let contactList = secondUser.contacts;
		let alreadyHasInList = false;
		contactList.map((user) => {
			if (user._id.toString() == req.auth._id) alreadyHasInList = true;
		});
		if (alreadyHasInList) next();
		else {
			const updateduser = await User.findOneAndUpdate(
				{ _id: to },
				{ $push: { contacts: req.profile } },
			);
			next();
		}
	} catch (err) {
		console.log(err);
		return res
			.status(400)
			.json("Failed to add for second user in contact list");
	}
};

exports.deleteMessage = async (req, res, next) => {
	try {
		const { messageId } = req.params;
		const newmessages = await Message.findByIdAndDelete(messageId);
		return res.json(newmessages);
	} catch (err) {
		console.log(err);
		return res.status(400).json({ error: "Failed to delete Message" });
	}
};
