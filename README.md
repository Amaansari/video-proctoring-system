# 🎥 Video Proctoring System  

An online **video interview proctoring system** built with the MERN stack.  
It helps interviewers monitor candidate focus and integrity by:  
- Detecting **face presence & multiple faces**  
- Tracking **eye focus / attention**  
- Recording the **interview session**  
- Generating a **detailed report (duration, score, event logs)**  

---

## 🚀 Features 
- 👀 **Focus Detection** (face tracking, attention checks)  
- 🛑 **Suspicious Events Logging** (no face, multiple faces)  
- 🎞️ **Recording Support** (store video of session)  
- 📊 **Report Generation** (score, candidate details, summary, logs)  
- 🌐 **MERN Stack** (MongoDB, Express, React, Node.js)  

---

## 🛠️ Tech Stack
- **Frontend:**  
  - React.js, TailwindCSS  
  - `@tensorflow-models/face-landmarks-detection` (eye/mouth/facial points tracking)  
  - `@tensorflow-models/coco-ssd` (object detection, e.g., phone/books during interview)  
  - `@tensorflow/tfjs` (TensorFlow.js backend)  

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (Mongoose ODM)  
- **Others:** REST API, Multer (Cloudinary storage), MediaRecorder API  

---

## ⚙️ Setup Instructions  

### 1️⃣ Clone the repository  
```bash
git clone https://github.com/amaansari/video-proctoring-system.git
cd video-proctoring-system
```

### 2️⃣ Backend Setup  
```bash
cd server
npm install
```

Create a `.env` file inside `server/` with the following:  
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_SECRET=your_secret_key
```

Run backend server:  
```bash
node index.js
```
(Default runs on **http://localhost:5000**)  

---

### 3️⃣ Frontend Setup  
```bash
cd client
npm install
```

Create a `.env` file inside `client/` with:  
```env
VITE_API_URL=http://localhost:5000
```

Run frontend:  
```bash
npm run dev
```
(Default runs on **http://localhost:5173**)  

---

## ▶️ Usage  
1. Start both **backend** (`node index.js`) and **frontend** (`npm run dev`)  
2. Open browser at [http://localhost:5173](http://localhost:5173)  
3. Enter candidate details and start the interview  
4. System detects focus, logs suspicious events, and records video  
5. End interview → Download **Report + Recording**  

---

## 📂 Project Structure
```
video-proctoring-system/
│
├── client/               # React frontend
│   ├── src/
│   └── .env
│
├── server/               # Node.js + Express backend
│   ├── util/             # computeIntegrityScore 
│   ├── config/           # Cloudinary configuration
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── controllers/      # Report & Interview logic
│   └── .env
│
└── README.md
```

---

## 📊 Example Report  
- Candidate Name  
- Duration of Interview  
- Integrity Score  
- Events Logged (No face, Multiple faces, etc.)  
- Final Remarks  

---

## ✅ Future Improvements
- 🔒 Role-based authentication (Interviewer/Candidate)  
- ☁️ Cloud storage for video recordings (AWS S3 / Firebase)  
- 📈 Advanced ML-based attention scoring  
- 📱 Mobile responsive UI  

---

## 👨‍💻 Author  
**Amaan Ansari**  
MERN Stack Developer  
