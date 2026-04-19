const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const IntelNode = require('../models/IntelNode');

// Local storage for images (fallback when S3 not configured)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/imint/'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.tif', '.tiff'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// GET all IMINT nodes
router.get('/', async (req, res) => {
  try {
    const nodes = await IntelNode.find({ type: 'IMINT' }).sort({ timestamp: -1 });
    res.json({ success: true, data: nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST upload satellite/aerial imagery
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });

  try {
    const imageUrl = `/uploads/imint/${req.file.filename}`;
    const { title, description, latitude, longitude, classification, tags } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }

    const node = new IntelNode({
      type: 'IMINT', title: title || 'Satellite Imagery',
      description: description || '', latitude: parseFloat(latitude),
      longitude: parseFloat(longitude), imageUrl,
      source: 'Manual Upload', classification: classification || 'UNCLASSIFIED',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      metadata: { filename: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype }
    });

    await node.save();
    res.status(201).json({ success: true, data: node });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all intel nodes (all types combined)
router.get('/all', async (req, res) => {
  try {
    const nodes = await IntelNode.find({}).sort({ timestamp: -1 });
    res.json({ success: true, data: nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a node
router.delete('/:id', async (req, res) => {
  try {
    await IntelNode.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Node deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
