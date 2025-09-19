import { useRef, useState } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const API_URL = import.meta.env.VITE_API_URL;

export default function Camera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastEventRef = useRef({});
  const detectorRef = useRef(null);
  const objectModelRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const interviewIdRef = useRef(null);
  const intervalRef = useRef(null);

  // UI State
  const [candidateName, setCandidateName] = useState("");
  const [interviewId, setInterviewId] = useState(null);
  const [events, setEvents] = useState([]);
  const [isInterviewRunning, setIsInterviewRunning] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- helper: log event to backend ---
  async function logEvent(type, meta = {}) {
    const now = new Date().toISOString();
    if (
      lastEventRef.current[type] &&
      Date.now() - lastEventRef.current[type] < 10000
    ) {
      return;
    }
    lastEventRef.current[type] = Date.now();

    const event = { type, startTime: now, endTime: null, meta };
    setEvents((prev) => [...prev, event]);

    if (interviewIdRef.current) {
      await fetch(`${API_URL}/api/interviews/${interviewIdRef.current}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
    }
  }

  // --- start interview: setup everything ---
  async function startInterview() {
    if (!candidateName.trim()) {
      alert("Please enter candidate name first!");
      return;
    }

    setLoading(true);

    try {
      if (events) setEvents([]);

      // 1. Create interview in backend
      const createRes = await fetch(`${API_URL}/api/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateName }),
      });
      const { interviewId } = await createRes.json();
      setInterviewId(interviewId);
      interviewIdRef.current = interviewId;

      // 2. Camera + mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // 3. Recorder
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const formData = new FormData();
        formData.append("video", blob, "interview.webm");
        await fetch(`${API_URL}/api/interviews/${interviewId}/video`, {
          method: "POST",
          body: formData,
        });
        setLoading(false);
        setHasEnded(true);
        console.log("Video uploaded");
      };
      recorder.start();

      // 4. Models
      detectorRef.current = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        { runtime: "tfjs", refineLandmarks: true, maxFaces: 2 }
      );
      objectModelRef.current = await cocoSsd.load();

      // 5. Detection loop
      let noFaceCounter = 0;
      let awayCounter = 0;
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !detectorRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // ---- FACE DETECTION ----
        const faces = await detectorRef.current.estimateFaces(videoRef.current);
        if (faces.length === 0) {
          noFaceCounter++;
          if (noFaceCounter >= 10) {
            logEvent("NO_FACE");
            noFaceCounter = 0;
          }
        } else {
          noFaceCounter = 0;
          if (faces.length > 1) logEvent("MULTIPLE_FACES");

          const face = faces[0];
          const box = face.box;
          ctx.strokeStyle = "lime";
          ctx.lineWidth = 3;
          ctx.strokeRect(
            box.xMin,
            box.yMin,
            box.xMax - box.xMin,
            box.yMax - box.yMin
          );

          const videoCenter = videoRef.current.videoWidth / 2;
          const faceCenterX = box.xMin + (box.xMax - box.xMin) / 2;
          if (Math.abs(faceCenterX - videoCenter) > 100) {
            awayCounter++;
            if (awayCounter >= 5) {
              logEvent("LOOKING_AWAY", { faceCenterX });
              awayCounter = 0;
            }
          } else {
            awayCounter = 0;
          }
        }

        // ---- OBJECT DETECTION ----
        const predictions = await objectModelRef.current.detect(
          videoRef.current
        );
        predictions.forEach((pred) => {
          const [x, y, w, h] = pred.bbox;
          if (pred.class.toLowerCase() === "cell phone" && pred.score > 0.5) {
            logEvent("PHONE_DETECTED", pred);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = "red";
            ctx.fillText("Phone 📱", x, y > 10 ? y - 5 : y + 15);
          }
          if (pred.class.toLowerCase() === "book" && pred.score > 0.6) {
            logEvent("BOOK_DETECTED", pred);
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = "yellow";
            ctx.fillText("Book 📘", x, y > 10 ? y - 5 : y + 15);
          }
        });
      }, 1000);
      setIsInterviewRunning(true);
      setHasEnded(false);
    } catch (err) {
      alert("Failed to start interview");
      console.error(err);
    } finally {
      setLoading(false); // hide loading
    }
  }

  // --- end interview ---
  async function endInterview() {
    setLoading(true);
    if (recorderRef.current) recorderRef.current.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);

    // stop camera stream
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // clear canvas
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx)
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    setCandidateName("");
    setIsInterviewRunning(false);
  }

  // --- download report ---
  async function downloadReport() {
    if (!interviewId) return alert("No interview started");
    if (events.length == 0) return alert("No Event to download report!");
    try {
      const res = await fetch(
        `${API_URL}/api/interviews/${interviewId}/report`
      );
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.message || "Failed to generate report"}`);
        return;
      }
      const csvData = await res.text();
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${interviewId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Something went wrong while downloading the report");
    }
  }

  return (
    <div className="flex gap-6 p-4 justify-center">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 opacity-70">
          <div className="bg-white p-6 rounded shadow text-lg font-semibold">
            Please wait... ⏳
          </div>
        </div>
      )}
      {/* Left */}
      <div className="relative">
        <h2 className="text-xl font-bold mb-3">Proctoring Camera</h2>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width="640"
          height="480"
          className="rounded shadow"
        />
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          className="absolute top-8 left-0"
        />
      </div>

      {/* Right */}
      <div className="w-80">
        <h3 className="font-semibold mb-3">Controls</h3>
        <input
          type="text"
          value={candidateName}
          onChange={(e) => setCandidateName(e.target.value)}
          placeholder="Enter candidate name"
          disabled={isInterviewRunning}
          className="border px-2 py-1 w-full mb-3 rounded"
        />
        <div className="space-y-2">
          <button
            onClick={startInterview}
            disabled={isInterviewRunning}
            className={`w-full px-4 py-2 rounded text-white ${
              isInterviewRunning
                ? "bg-gray-400"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Start Interview
          </button>
          <button
            onClick={endInterview}
            disabled={!isInterviewRunning}
            className={`w-full px-4 py-2 rounded text-white ${
              !isInterviewRunning
                ? "bg-gray-400"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            End Interview
          </button>
          <button
            onClick={downloadReport}
            disabled={!hasEnded}
            className={`w-full px-4 py-2 rounded text-white ${
              !hasEnded ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Download Report
          </button>
        </div>

        <h3 className="font-semibold mt-4 mb-2">Events</h3>
        <ul className="border p-2 h-64 overflow-y-auto rounded bg-gray-50 text-sm">
          {events.map((e, i) => (
            <li key={i}>
              {e.type} at {new Date(e.startTime).toLocaleTimeString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
