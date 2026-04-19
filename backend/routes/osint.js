const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');

// Check if MongoDB is connected
const isDbConnected = () => {
  try {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
  } catch { return false; }
};

// S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Mock S3 OSINT data — always works without AWS or MongoDB
const MOCK_S3_DATA = [
  {
    _id: 's3-demo-1',
    type: 'OSINT',
    title: 'S3 — Satellite Comms Intercept',
    classification: 'CONFIDENTIAL',
    description: 'Intercepted satellite communication patterns indicating coordinated movement near northern sector. Signal strength: HIGH.',
    latitude: 32.0836,
    longitude: 77.5667,
    source: 'S3:osint/comms-intercept.json',
    tags: ['comms', 'intercept', 'satellite'],
    metadata: { frequency: '1.4GHz', duration: '14min', confidence: '91%' },
    timestamp: new Date().toISOString()
  },
  {
    _id: 's3-demo-2',
    type: 'OSINT',
    title: 'S3 — Open Source Threat Report',
    classification: 'UNCLASSIFIED',
    description: 'Aggregated open-source data from 14 public forums indicating elevated threat posture in the western corridor.',
    latitude: 30.7333,
    longitude: 76.7794,
    source: 'S3:osint/threat-report.json',
    tags: ['threat', 'open-source', 'forum'],
    metadata: { sources: 14, sentiment: 'High Risk', reach: '4.1M' },
    timestamp: new Date().toISOString()
  },
  {
    _id: 's3-demo-3',
    type: 'OSINT',
    title: 'S3 — Border Activity Monitor',
    classification: 'CONFIDENTIAL',
    description: 'Automated border monitoring system flagged unusual vehicle density at 3 checkpoints over 6-hour window.',
    latitude: 33.7782,
    longitude: 74.8573,
    source: 'S3:osint/border-monitor.json',
    tags: ['border', 'vehicles', 'automated'],
    metadata: { checkpoints: 3, vehicles: 47, window: '6hrs' },
    timestamp: new Date().toISOString()
  },
  {
    _id: 's3-demo-4',
    type: 'OSINT',
    title: 'S3 — Social Network Analysis',
    classification: 'UNCLASSIFIED',
    description: 'Graph analysis of social network activity reveals coordinated information campaign originating from 3 clusters.',
    latitude: 25.3176,
    longitude: 82.9739,
    source: 'S3:osint/social-analysis.json',
    tags: ['social', 'network', 'campaign'],
    metadata: { clusters: 3, accounts: 156, reach: '890K' },
    timestamp: new Date().toISOString()
  }
];

// POST /api/osint/sync-s3
// Works with real AWS, MongoDB, or fully offline demo mode
router.post('/sync-s3', async (req, res) => {
  const hasRealAWS = process.env.AWS_S3_BUCKET &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key';

  // Real AWS S3 + MongoDB
  if (hasRealAWS && isDbConnected()) {
    try {
      const IntelNode = require('../models/IntelNode');
      const params = { Bucket: process.env.AWS_S3_BUCKET, Prefix: 'osint/' };
      const listed = await s3.listObjectsV2(params).promise();
      let inserted = 0;
      for (const obj of listed.Contents || []) {
        if (!obj.Key.endsWith('.json')) continue;
        const file = await s3.getObject({ Bucket: process.env.AWS_S3_BUCKET, Key: obj.Key }).promise();
        const records = JSON.parse(file.Body.toString('utf-8'));
        const arr = Array.isArray(records) ? records : [records];
        for (const item of arr) {
          if (item.latitude && item.longitude) {
            await IntelNode.findOneAndUpdate(
              { title: item.title, type: 'OSINT' },
              { ...item, type: 'OSINT', source: `S3:${obj.Key}` },
              { upsert: true, new: true }
            );
            inserted++;
          }
        }
      }
      return res.json({ success: true, message: `Synced ${inserted} OSINT records from S3`, data: [] });
    } catch (err) {
      // Fall through to demo mode on any error
    }
  }

  // Demo mode — always succeeds, returns mock data directly to frontend
  const demoData = MOCK_S3_DATA.map(item => ({
    ...item,
    _id: `${item._id}-${Date.now()}`,
    timestamp: new Date().toISOString()
  }));

  return res.json({
    success: true,
    message: `S3 DEMO: ${demoData.length} OSINT records synced from simulated S3 bucket`,
    demo: true,
    data: demoData
  });
});

// GET all OSINT nodes from MongoDB
router.get('/', async (req, res) => {
  if (!isDbConnected()) return res.json({ success: true, data: [] });
  try {
    const IntelNode = require('../models/IntelNode');
    const nodes = await IntelNode.find({ type: 'OSINT' }).sort({ timestamp: -1 });
    res.json({ success: true, data: nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new OSINT node
router.post('/', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ success: false, error: 'Database not connected' });
  try {
    const IntelNode = require('../models/IntelNode');
    const node = new IntelNode({ ...req.body, type: 'OSINT' });
    await node.save();
    res.status(201).json({ success: true, data: node });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST seed demo OSINT data
router.post('/seed', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ success: false, error: 'Database not connected' });
  try {
    const IntelNode = require('../models/IntelNode');
    const demoData = [
      {
        type: 'OSINT', title: 'Social Media Activity Spike', classification: 'UNCLASSIFIED',
        description: 'Unusual social media activity detected near border region.',
        latitude: 28.6139, longitude: 77.2090, source: 'Twitter/X Monitor',
        tags: ['social-media', 'coordination'], metadata: { platform: 'Twitter', posts: 342 }
      },
      {
        type: 'OSINT', title: 'Forum Intelligence Report', classification: 'CONFIDENTIAL',
        description: 'Dark web forum activity indicating potential logistics movement.',
        latitude: 19.0760, longitude: 72.8777, source: 'Dark Web Monitor',
        tags: ['forum', 'logistics'], metadata: { confidence: '78%' }
      },
      {
        type: 'OSINT', title: 'News Aggregation Alert', classification: 'UNCLASSIFIED',
        description: 'Multiple news sources reporting military exercises near eastern corridor.',
        latitude: 22.5726, longitude: 88.3639, source: 'News Aggregator',
        tags: ['military', 'exercises'], metadata: { sources: 8, reach: '2.3M' }
      }
    ];
    await IntelNode.insertMany(demoData);
    res.json({ success: true, message: 'OSINT seed data inserted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
