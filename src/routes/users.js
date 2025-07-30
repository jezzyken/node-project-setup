const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAvailableRoles,
  getMe
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { autoCheckPermission } = require('../middleware/permissions');

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.get('/roles', autoCheckPermission, getAvailableRoles);

router.use(autoCheckPermission);

router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;