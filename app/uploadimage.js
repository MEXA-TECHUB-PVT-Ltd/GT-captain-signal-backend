 // imageupload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDirectory = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

const imageUploadRouter = express.Router();

imageUploadRouter.post('/', upload.single('image'), (req, res) => {
    if (req.file) {
        res.json({ status: true, imageUrl: `image/${req.file.filename}` });
    } else {
        res.status(400).json({ status: false, error: 'No file uploaded' });
    }
});

imageUploadRouter.use('/image', express.static(uploadDirectory));

module.exports = imageUploadRouter;
