const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
  type: { type: String, enum: ["NO_FACE", "LOOKING_AWAY", "MULTIPLE_FACES", "PHONE_DETECTED", "BOOK_DETECTED"] },
  startTime: Date,
  endTime: Date,
  meta: Object
});

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
