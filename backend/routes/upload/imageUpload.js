const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const requireAdmin = require('../../middleware/requireAdmin');
const { upload, uploadImage } = require('../../utils/upload/imageHandler');

/**
 * POST /api/upload/image
 * Handles single product image upload
 */
router.post('/', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const result = await uploadImage(req.file);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Upload route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed'
    });
  }
});

module.exports = router;
