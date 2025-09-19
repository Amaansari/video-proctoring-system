const Interview = require("../models/interview");
const Event = require("../models/event");
const { Parser } = require("json2csv");
const { computeIntegrityScore } = require("../util/computeIntegrityScore");

const createInterview = async (req, res) => {
  const { candidateName } = req.body;
  const interview = new Interview({ candidateName, startTime: new Date() });
  await interview.save();
  res.json({ interviewId: interview._id });
};

const saveEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const event = req.body; // event
    // save events
    const savedEvent = await Event.insertOne({...event, interviewId: id });

    res.json({
      message: "Event saved",
      savedEvent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving event" });
  }
};

const uploadVideo = async (req, res) => {
  const { id } = req.params;
  const videoUrl = req.file.path;
  await Interview.findByIdAndUpdate(id, { videoUrl, endTime: new Date() });
  res.json({ videoUrl });
};


const generateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const events = await Event.find({ interviewId: id });

    // --- compute stats ---
    const { finalScore, deductions } = computeIntegrityScore(events);

    const durationMs =
      new Date(interview.endTime || Date.now()) - new Date(interview.startTime);
    const durationMinutes = (durationMs / 60000).toFixed(2);

    const counts = {
      LOOKING_AWAY: events.filter((e) => e.type === "LOOKING_AWAY").length,
      NO_FACE: events.filter((e) => e.type === "NO_FACE").length,
      MULTIPLE_FACES: events.filter((e) => e.type === "MULTIPLE_FACES").length,
      PHONE_DETECTED: events.filter((e) => e.type === "PHONE_DETECTED").length,
      BOOK_DETECTED: events.filter((e) => e.type === "BOOK_DETECTED").length,
    };

    // --- summary section ---
    const summary = [
      {
        candidateName: interview.candidateName,
        startTime: interview.startTime,
        endTime: interview.endTime,
        durationMinutes,
        ...counts,
        finalIntegrityScore: finalScore,
      },
    ];

    // --- detailed events section ---
    const eventFields = ["type", "startTime", "endTime", "meta"];
    const eventParser = new Parser({ fields: eventFields });
    const eventCsv = eventParser.parse(events);

    // --- build full CSV string ---
    let csvOutput = "=== Interview Summary ===\n";
    csvOutput += Object.keys(summary[0])
      .map((k) => `${k},${summary[0][k]}`)
      .join("\n");
    csvOutput += "\n\n=== Event Logs ===\n";
    csvOutput += eventCsv;

    // --- return CSV ---
    res.header("Content-Type", "text/csv");
    res.attachment(`report_${id}.csv`);
    return res.send(csvOutput);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating report" });
  }
};

module.exports = {createInterview, saveEvents, uploadVideo, generateReport};

