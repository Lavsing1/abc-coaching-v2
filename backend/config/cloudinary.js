const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const makeStorage = (folder) => new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `abc-coaching/${folder}`,
    resource_type: 'raw',
    allowed_formats: ['pdf','jpg','jpeg','png','gif','webp'],
    public_id: `${folder}_${Date.now()}_${file.originalname.replace(/\s+/g,'_')}`,
  }),
});

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg','image/png','image/gif','image/webp',
];

const makeUpload = (folder) => multer({
  storage: makeStorage(folder),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type — PDF or image only'));
  },
});

module.exports = { cloudinary, makeUpload };
