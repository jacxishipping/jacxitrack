const Container = require('../models/Container');
const { lookupContainer } = require('../utils/trackingLookup');

function serialize(container) {
  return container.toObject ? container.toObject() : container;
}

async function createContainer(req, res, next) {
  try {
    const { containerNumber, currentStatus, containerData } = req.body;
    const now = new Date();
    const container = await Container.create({
      containerNumber,
      currentStatus,
      lastUpdated: now,
      containerData,
      history: [{ status: currentStatus, updatedAt: now, source: 'api', metadata: containerData }]
    });
    return res.status(201).json({ data: serialize(container) });
  } catch (error) { return next(error); }
}

async function getContainer(req, res, next) {
  try {
    const { containerNumber } = req.params;
    let container = await Container.findOne({ containerNumber });
    if (!container) {
      const tracking = await lookupContainer(containerNumber);
      container = await Container.create({
        ...tracking,
        history: [{ status: tracking.currentStatus, updatedAt: tracking.lastUpdated, source: 'mock-lookup', metadata: tracking.containerData }]
      });
    }
    return res.json({ data: serialize(container) });
  } catch (error) { return next(error); }
}

async function updateStatus(req, res, next) {
  try {
    const { containerNumber } = req.params;
    const { currentStatus, containerData } = req.body;
    const now = new Date();
    const update = {
      $set: { currentStatus, lastUpdated: now },
      $push: { history: { status: currentStatus, updatedAt: now, source: 'api', metadata: containerData || {} } }
    };
    if (containerData !== undefined) update.$set.containerData = containerData;

    const container = await Container.findOneAndUpdate({ containerNumber }, update, { new: true, runValidators: true });
    if (!container) return res.status(404).json({ error: 'Container not found' });
    return res.json({ data: serialize(container) });
  } catch (error) { return next(error); }
}

async function listContainers(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const filter = status ? { currentStatus: status } : {};
    const [containers, total] = await Promise.all([
      Container.find(filter).sort({ lastUpdated: -1 }).skip((page - 1) * limit).limit(limit),
      Container.countDocuments(filter)
    ]);
    return res.json({
      data: containers.map(serialize),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) { return next(error); }
}

module.exports = { createContainer, getContainer, updateStatus, listContainers };
