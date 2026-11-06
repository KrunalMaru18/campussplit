const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/group/:groupId', expenseController.createExpense);
router.get('/group/:groupId', expenseController.getGroupExpenses);
router.put('/:expenseId', expenseController.updateExpense);
router.delete('/:expenseId', expenseController.deleteExpense);

module.exports = router;
