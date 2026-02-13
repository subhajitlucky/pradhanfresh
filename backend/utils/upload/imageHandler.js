const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const cloudinary = require('cloudinary').v2; // Injected as needed

// Storage configuration for local development
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: localStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Robust utility for handling product image uploads.
 * Supports local development and production (Cloudinary).
 */
const uploadImage = async (file) => {
  if (process.env.NODE_ENV === 'production') {
    // This is a placeholder for Cloudinary integration
    // const result = await cloudinary.uploader.upload(file.path, { folder: 'pradhanfresh/products' });
    // return { url: result.secure_url, public_id: result.public_id };
    return { url: `/uploads/${file.filename}`, id: file.filename };
  } else {
    // Return local path (accessible via static middleware)
    return { url: `/uploads/${file.filename}`, id: file.filename };
  }
};

module.exports = {
  upload,
  uploadImage
};
