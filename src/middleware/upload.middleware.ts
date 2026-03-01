import cloudinary from 'cloudinary';
import multer from 'multer';
import * as multerCloudinary from 'multer-storage-cloudinary';
import '../config/cloudinary.config'; // Import config to ensure cloudinary is configured

// Get the factory function from the module (handles CommonJS interop)
const CloudinaryStorage = (multerCloudinary as { default?: unknown }).default || multerCloudinary;

// Configure storage for avatar images
const avatarStorage = process.env.NODE_ENV === 'test'
    ? multer.memoryStorage()
    : (CloudinaryStorage as (opts: unknown) => multer.StorageEngine)({
        cloudinary: cloudinary,
        params: {
            folder: 'avatars',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            transformation: [{ width: 500, height: 500, crop: 'limit' }] // Optimize image size
        }
    });

// Allow only image mime types
const avatarFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
};

export const uploadAvatarMiddleware = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'Avatar', maxCount: 1 }
]);
