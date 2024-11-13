const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid'); // Import UUID for generating image_id
const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

// AWS S3 configuration with validation
let s3 = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION && process.env.AWS_BUCKET_NAME) {
    s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });
} else {
    console.warn("AWS S3 is not properly configured. Skipping S3 upload.");
}

// Azure Blob Storage configuration with validation
let blobServiceClient = null;
let containerClient = null;

if (process.env.AZURE_STORAGE_CONNECTION_STRING && process.env.AZURE_CONTAINER_NAME) {
    try {
        blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
        containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);
    } catch (err) {
        console.error("Error configuring Azure Blob Service:", err.message);
    }
} else {
    console.warn("Azure Blob Storage is not properly configured. Skipping Azure upload.");
}

// Function to upload to AWS S3
const uploadToS3 = (file) => {
    if (!s3) {
        throw new Error("AWS S3 is not configured.");
    }

    const fileContent = fs.readFileSync(file.path);
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.filename,
        Body: fileContent,
        ContentType: file.mimetype
    };
    return s3.upload(params).promise();
};

// Function to upload to Azure Blob Storage
const uploadToAzure = async (file) => {
    if (!containerClient) {
        throw new Error("Azure Blob Storage is not configured.");
    }

    const blockBlobClient = containerClient.getBlockBlobClient(file.filename);
    await blockBlobClient.uploadFile(file.path);
    return `https://${blobServiceClient.accountName}.blob.core.windows.net/${process.env.AZURE_CONTAINER_NAME}/${file.filename}`;
};

// Function to handle image upload
const sharp = require('sharp');

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const imageId = uuidv4();
        const originalFilename = req.file.filename;
        const compressedFilename = `${imageId}.webp`;
        const compressedPath = path.join(__dirname, '../public/uploads', compressedFilename);
        const image_details = await sharp(req.file.path).metadata();
        const {width, height} = image_details;
        
        const EIGHT_K = 7680; // 8K
        const FOUR_K = 3840; // 4K
        const TWO_K = 2048; // 2K
        const ONE_K = 1024; // 1K
        const HD_720P = 720; // 720p
        const SD_480P = 480; // 480p
        const maxDimension = Math.max(width, height);
        let reductionPercentage = 1;

        if (maxDimension >= EIGHT_K) {
          reductionPercentage = 0.2; // Reduce TO 20% of original size
        } else if (maxDimension >= FOUR_K) {
          reductionPercentage = 0.4; // Reduce TO 40% of original size
        } else if (maxDimension >= TWO_K) {
          reductionPercentage = 0.5; // Reduce TO 50% of original size
        } else if (maxDimension >= ONE_K) {
          reductionPercentage = 0.75; // Reduce TO 75% of original size
        } else if (maxDimension >= HD_720P) {
          reductionPercentage = 0.8; // Reduce TO 80% of original size
        } else if (maxDimension <= SD_480P) {
          reductionPercentage = 1; // No reduction for 480p or lower
        }

        const newWidth = Math.round(width * reductionPercentage);
        const newHeight = Math.round(height * reductionPercentage);

        // Compress and convert the image to WebP format
        await sharp(req.file.path)
            .resize(newWidth,newHeight) // Resize width to 800px (or adjust as needed)
            .webp({
                quality: 80,
                effort: 6,
                lossless: false,
                nearLossless: false,
                smartSubsample: true,
                mixed: true,
              }) // Set WebP quality
            .toFile(compressedPath);

        // Respond with download link for the processed image
        res.status(200).json({
            message: 'Image uploaded, compressed, and converted successfully',
            originalFilename,
            compressedFilename,
            downloadUrl: `/uploads/${compressedFilename}`
        });
    } catch (error) {
        console.error('Error during upload:', error.message);
        res.status(500).json({
            message: 'Error processing the image',
            error: error.message
        });
    }
};


// Function to list all images
exports.listImages = (req, res) => {
    const uploadsDir = path.join(__dirname, '../public/uploads'); // Directory where images are stored

    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Unable to scan directory:', err);
            return res.status(500).json({ message: 'Unable to retrieve images' });
        }

        // Filter out only image files (optional, depending on what you store in the folder)
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

        // If no images are found
        if (imageFiles.length === 0) {
            return res.status(404).json({ message: 'No images found' });
        }

        // Map each file to return its filename and accessible URL
        const imageList = imageFiles.map(file => ({
            filename: file,
            url: `/uploads/${file}`
        }));

        // Respond with the list of images
        res.status(200).json({
            message: 'Images retrieved successfully',
            images: imageList
        });
    });
};

// Function to get a specific image by ID (filename in this case)
exports.getImageById = (req, res) => {
    const uploadsDir = path.join(__dirname, '../public/uploads');
    const imageId = req.params.image_id;
    const imagePath = path.join(uploadsDir, imageId);

    if (fs.existsSync(imagePath)) {
        res.status(200).sendFile(imagePath); // Send the image file as a response
    } else {
        res.status(404).json({ message: `Image with ID: ${imageId} not found` });
    }
};

// Function to delete a specific image by ID
exports.deleteImage = (req, res) => {
    const uploadsDir = path.join(__dirname, '../public/uploads');
    const imageId = req.params.image_id;
    const imagePath = path.join(uploadsDir, imageId);

    if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error deleting the image' });
            }
            res.status(200).json({ message: `Deleted image with ID: ${imageId}` });
        });
    } else {
        res.status(404).json({ message: `Image with ID: ${imageId} not found` });
    }
};