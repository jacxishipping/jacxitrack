const express = require('express');
const controller = require('../controllers/containerController');
const { containerNumber, createContainerSchema, statusUpdateSchema, listContainersSchema, validate } = require('../utils/validation');

const router = express.Router();
const paramsSchema = require('zod').z.object({ containerNumber });

router.route('/')
  .post(validate(createContainerSchema, 'body'), controller.createContainer)
  .get(validate(listContainersSchema, 'query'), controller.listContainers);

router.get('/:containerNumber', validate(paramsSchema, 'params'), controller.getContainer);
router.put('/:containerNumber/status', validate(paramsSchema, 'params'), validate(statusUpdateSchema, 'body'), controller.updateStatus);

module.exports = router;
