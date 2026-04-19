const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const IntelNode = require('../models/IntelNode');

const upload = multer({ dest: 'uploads/humint/' });

// GET all HUMINT nodes
router.get('/', async (req, res) => {
  try {
    const nodes = await IntelNode.find({ type: 'HUMINT' }).sort({ timestamp: -1 });
    res.json({ success: true, data: nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST manual HUMINT entry
router.post('/', async (req, res) => {
  try {
    const node = new IntelNode({ ...req.body, type: 'HUMINT' });
    await node.save();
    res.status(201).json({ success: true, data: node });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST upload CSV/Excel/JSON field report
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

  const filePath = req.file.path;
  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const results = [];

  try {
    if (ext === 'json') {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of arr) {
        if (item.latitude && item.longitude) {
          results.push(new IntelNode({ ...item, type: 'HUMINT', source: req.file.originalname }));
        }
      }
      await IntelNode.insertMany(results);
      fs.unlinkSync(filePath);
      return res.json({ success: true, inserted: results.length });
    }

    if (ext === 'csv') {
      const rows = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', async () => {
          for (const row of rows) {
            if (row.latitude && row.longitude) {
              results.push(new IntelNode({
                type: 'HUMINT', title: row.title || 'Field Report',
                description: row.description || '', latitude: parseFloat(row.latitude),
                longitude: parseFloat(row.longitude), source: req.file.originalname,
                classification: row.classification || 'UNCLASSIFIED',
                tags: row.tags ? row.tags.split(',') : [], metadata: row
              }));
            }
          }
          await IntelNode.insertMany(results);
          fs.unlinkSync(filePath);
          res.json({ success: true, inserted: results.length });
        });
      return;
    }

    if (ext === 'xlsx' || ext === 'xls') {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet);
      for (const row of rows) {
        if (row.latitude && row.longitude) {
          results.push(new IntelNode({
            type: 'HUMINT', title: row.title || 'Field Report',
            description: row.description || '', latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude), source: req.file.originalname,
            classification: row.classification || 'UNCLASSIFIED',
            tags: row.tags ? String(row.tags).split(',') : [], metadata: row
          }));
        }
      }
      await IntelNode.insertMany(results);
      fs.unlinkSync(filePath);
      return res.json({ success: true, inserted: results.length });
    }

    fs.unlinkSync(filePath);
    res.status(400).json({ success: false, error: 'Unsupported file format' });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
