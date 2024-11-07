
# Image Uploader API

An **Image Uploader API** built using **Node.js**, **Express.js**, **AWS S3**, and **Azure Blob Storage**. This API allows users to upload images to local storage, AWS S3, or Azure Blob Storage, based on environment configurations, and serves images via **AWS CloudFront** or **Azure CDN**.

## Features

- Upload images to **local storage**, **AWS S3**, or **Azure Blob Storage**.
- Serve images using **AWS CloudFront** or **Azure CDN**.
- Supports graceful error handling with detailed error responses.
- Uses **multer** for file uploads and supports image format validations (JPEG, JPG, PNG).
- RESTful API for listing, uploading, retrieving, and deleting images.

## Prerequisites

Ensure you have the following installed:

- **Node.js**: v14 or later
- **Docker**: Docker Engine & Docker Compose
- **AWS Account**: (For S3 setup)
- **Azure Account**: (For Blob Storage setup)

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-repo/clj-backend.git
cd clj-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root of the project with the following content:

```bash
# Database configuration
DB_HOST=db
DB_USER=user
DB_PASSWORD=password
DB_NAME=clj_backend_db

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=your-aws-region
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_CLOUDFRONT_URL=https://your-cloudfront-url  # AWS CloudFront distribution URL

# Azure Blob Configuration
AZURE_STORAGE_CONNECTION_STRING=your-azure-storage-connection-string
AZURE_CONTAINER_NAME=your-azure-container-name
AZURE_CDN_URL=https://your-azure-cdn-url  # Azure CDN endpoint

# Upload destination (choose: s3, azure, or both)
UPLOAD_DEST=s3  # or azure or both
```

### Step 4: Run the Application with Docker

The application is containerized using Docker. Use the following commands to build and run the application:

```bash
docker-compose up --build
```

This will:

- Build the application.
- Start the MySQL database container.
- Start the Node.js server.

### Step 5: Test the API

You can test the API endpoints using tools like **Postman** or **cURL**.

#### Upload an Image

```bash
curl -F "image=@path_to_image.jpg" http://localhost:3000/api/images/upload
```

#### List Uploaded Images

```bash
curl http://localhost:3000/api/images/list
```

#### Retrieve an Image by `image_id`

```bash
curl http://localhost:3000/api/images/:image_id
```

#### Delete an Image by `image_id`

```bash
curl -X DELETE http://localhost:3000/api/images/:image_id
```

### Step 6: Access Uploaded Images

- **Local Uploads**: Access uploaded images via `http://localhost:3000/uploads/filename`.
- **AWS S3 Uploads**: Uploaded images will be served via your **CloudFront URL**.
- **Azure Blob Uploads**: Uploaded images will be served via your **Azure CDN URL**.

### Error Handling

If there are issues with file uploads or image processing, the API responds with a detailed JSON error message, while the server continues running.

### File Structure

```
.
├── Dockerfile
├── README.md
├── docker-compose.yml
├── package-lock.json
├── package.json
├── public
│   └── uploads
└── src
    ├── app.js
    ├── controllers
    │   └── imageController.js
    ├── routes
    │   └── imageRoutes.js
    └── wait-for-it.sh
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
