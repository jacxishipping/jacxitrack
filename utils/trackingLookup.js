const { normalizeContainerNumber } = require('./containerNumber');

/**
 * Replace this deterministic mock with a carrier webhook/client integration.
 * Incoming carrier events should update currentStatus, lastUpdated, and history atomically.
 */
async function lookupContainer(containerNumber) {
  const normalized = normalizeContainerNumber(containerNumber);
  const statuses = ['In transit', 'At port', 'Customs clearance', 'Delivered'];
  const status = statuses[normalized.charCodeAt(0) % statuses.length];

  return {
    containerNumber: normalized,
    currentStatus: status,
    lastUpdated: new Date(),
    containerData: {
      provider: 'mock-tracking-provider',
      location: 'Mock Logistics Hub',
      estimatedArrival: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
}

module.exports = { lookupContainer };
