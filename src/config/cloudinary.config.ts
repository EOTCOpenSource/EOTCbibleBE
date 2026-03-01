import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Configure dotenv to ensure environment variables are loaded
dotenv.config();

// Validate required environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET) {
    console.warn('⚠️ Cloudinary environment variables are missing. Image uploads will fail.');
}

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string
});

export default cloudinary;
