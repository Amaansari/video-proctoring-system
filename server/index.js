require("dotenv").config();
const express = require('express');
const app = express();
const interviewRoutes = require('./routes/interviewRoutes')
const mongoose = require("mongoose");
const cors = require("cors");


app.use(cors());
app.use(express.json());
app.use('/api/interviews',interviewRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log(err));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Server running on port:", port));
