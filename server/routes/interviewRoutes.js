const express = require('express');
const { createInterview, saveEvents, uploadVideo, generateReport } = require('../controllers/interviewController');
const path = require("path");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../config/cloudinary");

const upload = multer({ storage });

//create interview
router.post('/',createInterview);

//save events
router.post('/:id/event',saveEvents);

// Upload video
router.post('/:id/video',upload.single('video'),uploadVideo);

//generate report
router.get('/:id/report',generateReport);

module.exports = router;