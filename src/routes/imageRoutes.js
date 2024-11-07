const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// File filter to check for image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed (jpeg, jpg, png).'));
    }
};

// Configure multer with error handling
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
}).single('image');

// Upload image route with error handling
router.post('/upload', (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                type: 'MulterError',
                message: err.message
            });
        } else if (err) {
            return res.status(400).json({
                type: 'FileValidationError',
                message: err.message
            });
        }
        next();
    });
}, imageController.uploadImage);

// List all uploaded images
router.get('/list', imageController.listImages);

// Get specific image by image_id
router.get('/:image_id', imageController.getImageById);

// Delete image by image_id
router.delete('/:image_id', imageController.deleteImage);

module.exports = router;