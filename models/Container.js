const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  status: { type: String, required: true, trim: true },
  updatedAt: { type: Date, required: true, default: Date.now },
  source: { type: String, required: true, default: 'api' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const containerSchema = new mongoose.Schema({
  containerNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  currentStatus: { type: String, required: true, trim: true },
  lastUpdated: { type: Date, required: true, default: Date.now },
  containerData: { type: mongoose.Schema.Types.Mixed, default: {} },
  history: { type: [historySchema], default: [] }
}, { timestamps: true, versionKey: false });

containerSchema.index({ currentStatus: 1, lastUpdated: -1 });

module.exports = mongoose.model('Container', containerSchema);
