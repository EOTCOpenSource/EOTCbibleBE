declare module 'multer-storage-cloudinary' {
    import { StorageEngine } from 'multer';
    import { v2 as cloudinary } from 'cloudinary';

    interface CloudinaryStorageOptions {
        cloudinary: typeof cloudinary;
        params?:
        | {
            folder?: string;
            allowed_formats?: string[];
            transformation?: Array<Record<string, unknown>>;
            format?: string;
            public_id?: (req: unknown, file: unknown) => string;
            [key: string]: unknown;
        }
        | ((
            req: unknown,
            file: unknown
        ) => Promise<{
            folder?: string;
            allowed_formats?: string[];
            transformation?: Array<Record<string, unknown>>;
            format?: string;
            public_id?: string;
            [key: string]: unknown;
        }>);
    }

    // The package exports a factory function, not a class
    function CloudinaryStorage(options: CloudinaryStorageOptions): StorageEngine;
    export default CloudinaryStorage;
}
