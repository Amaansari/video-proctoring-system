const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log(err));

// Models
const Interview = mongoose.model("Interview", new mongoose.Schema({
  candidateName: String,
  startTime: Date,
  endTime: Date,
  videoUrl: String,
  integrityScore: Number
}));

const Event = mongoose.model("Event", new mongoose.Schema({
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
  type: String,
  startTime: Date,
  endTime: Date,
  meta: Object
}));

// Multer config for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Routes

// Create interview
app.post("/api/interviews", async (req, res) => {
  const { candidateName } = req.body;
  const interview = new Interview({ candidateName, startTime: new Date() });
  await interview.save();
  res.json({ interviewId: interview._id });
});

// Save events
app.post("/api/interviews/:id/events", async (req, res) => {
  const { id } = req.params;
  const events = req.body.events; // array of events
  const savedEvents = await Event.insertMany(events.map(e => ({ ...e, interviewId: id })));
  res.json(savedEvents);
});

// Upload video
app.post("/api/interviews/:id/video", upload.single("video"), async (req, res) => {
  const { id } = req.params;
  const videoUrl = req.file.path;
  await Interview.findByIdAndUpdate(id, { videoUrl, endTime: new Date() });
  res.json({ videoUrl });
});

// Generate report (simple JSON)
app.get("/api/interviews/:id/report", async (req, res) => {
  const { id } = req.params;
  const interview = await Interview.findById(id);
  const events = await Event.find({ interviewId: id });
  res.json({ interview, events });
});

app.listen(5000, () => console.log("Server running on port 5000"));
