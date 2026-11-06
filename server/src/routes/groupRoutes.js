const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');

// Public Group Routes (for friends opening shareable invitation links)
router.get('/preview/:inviteCode', groupController.getGroupPreview);
router.post('/join-with-auth', groupController.joinWithAuth);

// Protected Group Routes (requires logged-in user)
router.use(authenticateToken);

router.post('/', groupController.createGroup);
router.get('/', groupController.getUserGroups);
router.post('/join', groupController.joinGroupByInviteCode);
router.get('/:groupId', groupController.getGroupById);
router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);
router.post('/:groupId/members', groupController.addMemberByEmail);

module.exports = router;
