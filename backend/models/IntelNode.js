const mongoose = require('mongoose');

const IntelNodeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['OSINT', 'HUMINT', 'IMINT'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  source: { type: String },
  imageUrl: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  classification: {
    type: String,
    enum: ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET'],
    default: 'UNCLASSIFIED'
  },
  timestamp: { type: Date, default: Date.now },
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('IntelNode', IntelNodeSchema);
