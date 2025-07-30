const express = require('express');
const authRoutes = require('./auth');
const roleRoutes = require('./roles');
const userRoutes = require('./users');
const permissionRoutes = require('./permissions');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/permissions', permissionRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;