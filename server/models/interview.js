const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidateName: String,
  startTime: Date,
  endTime: Date,
  videoUrl: String,
  integrityScore: Number
});

const Interview = mongoose.model("Interview",interviewSchema); 
module.exports = Interview;