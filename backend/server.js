require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
['uploads/humint', 'uploads/imint'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/osint', require('./routes/osint'));
app.use('/api/humint', require('./routes/humint'));
app.use('/api/imint', require('./routes/imint'));

// Combined all nodes endpoint
app.get('/api/nodes', async (req, res) => {
  try {
    const IntelNode = require('./models/IntelNode');
    const { type, classification } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (classification) filter.classification = classification;
    const nodes = await IntelNode.find(filter).sort({ timestamp: -1 });
    res.json({ success: true, data: nodes, count: nodes.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const IntelNode = require('./models/IntelNode');
    const [total, osint, humint, imint] = await Promise.all([
      IntelNode.countDocuments(),
      IntelNode.countDocuments({ type: 'OSINT' }),
      IntelNode.countDocuments({ type: 'HUMINT' }),
      IntelNode.countDocuments({ type: 'IMINT' })
    ]);
    res.json({ success: true, data: { total, osint, humint, imint } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'operational', timestamp: new Date() }));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/intel_dashboard';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Starting server without database (demo mode)...');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT} (no DB)`));
  });
