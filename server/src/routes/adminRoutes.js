const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');

// Admin Auth Guard Middleware
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Super Admin privileges required.' });
  }
  next();
}

// Public Admin Login
router.post('/login', adminController.adminLogin);

// Protected Admin Routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', adminController.getAdminStats);
router.get('/users', adminController.getAdminUsers);
router.put('/users/:userId/role', adminController.toggleAdminStatus);
router.put('/users/:userId/password', adminController.updateUserPassword);
router.put('/users/:userId', adminController.updateUserDetails);
router.delete('/users/:userId', adminController.deleteUser);
router.get('/groups', adminController.getAdminGroups);
router.delete('/groups/:groupId', adminController.deleteAdminGroup);
router.get('/activity', adminController.getAdminActivity);
router.post('/clear-transactions', adminController.clearAllTransactions);

module.exports = router;
