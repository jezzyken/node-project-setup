const express = require('express');
const {
  getAllPermissions,
  getPermissionByResource,
  createPermission,
  updatePermission,
  addActionToPermission,
  removeActionFromPermission,
  deletePermission
} = require('../controllers/permissionController');
const { protect } = require('../middleware/auth');
const { autoCheckPermission } = require('../middleware/permissions');

const router = express.Router();

router.use(protect);
router.use(autoCheckPermission);

router.route('/')
  .get(getAllPermissions)
  .post(createPermission);

router.route('/:resource')
  .get(getPermissionByResource)
  .patch(updatePermission)
  .delete(deletePermission);

router.route('/:resource/actions')
  .post(addActionToPermission);

router.route('/:resource/actions/:actionName')
  .delete(removeActionFromPermission);

module.exports = router;