const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/group/:groupId', settlementController.createSettlement);
router.get('/group/:groupId', settlementController.getGroupSettlements);
router.delete('/:settlementId', settlementController.deleteSettlement);

module.exports = router;
