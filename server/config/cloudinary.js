// config/cloudinary.js
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

console.log('secret',process.env.CLOUDINARY_SECRET)

cloudinary.config({
  cloud_name: "dh8fp6zfx",
  api_key: "488659417748269",
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "interview-recordings",
    resource_type: "video",
  },
});

module.exports = { storage };
