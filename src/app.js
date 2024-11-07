const express = require('express');
const app = express();
const imageRoutes = require('./routes/imageRoutes');
const path = require('path');

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static('public'));

// Use the imageRoutes for /api/images
app.use('/api/images', imageRoutes);

// Define a basic route to check if the server is running
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Image Uploader API' });
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        type: 'ServerError',
        message: 'An unexpected error occurred',
        error: err.message
    });
});

// Handle 404 for undefined routes
app.use((req, res) => {
    res.status(404).json({
        type: 'NotFoundError',
        message: 'The requested resource was not found'
    });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});