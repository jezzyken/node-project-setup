const express = require('express');
const {
  createRole,
  getAllRoles,
  getRoleById,
  getRoleByName,
  updateRole,
  deleteRole,
  getUsersByRole,
  updateUserRole,
  checkUserPermission
} = require('../controllers/roleController');
const { protect } = require('../middleware/auth');
const { autoCheckPermission } = require('../middleware/permissions');

const router = express.Router();

router.use(protect);
router.use(autoCheckPermission);

router.route('/')
  .get(getAllRoles)
  .post(createRole);

router.route('/:id')
  .get(getRoleById)
  .patch(updateRole)
  .delete(deleteRole);

router.get('/name/:roleName', getRoleByName);
router.get('/:id/users', getUsersByRole);

router.patch('/users/:userId', updateUserRole);
router.get('/users/:userId/permissions', checkUserPermission);

module.exports = router;