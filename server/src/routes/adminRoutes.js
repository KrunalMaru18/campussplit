const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');

// Admin Auth Guard Middleware
function requireAdmin(req, res, next) {
  const isSuperAdmin =
    req.user &&
    (req.user.role === 'admin' ||
      req.user.is_admin ||
      ['krunal@campus.edu', 'krunal@gmail.com', 'marukrunal.study@gmail.com', 'krunalmaru@gmail.com'].includes(
        req.user?.email?.toLowerCase()
      ) ||
      req.user?.email?.toLowerCase().startsWith('krunal'));

  if (!isSuperAdmin) {
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
