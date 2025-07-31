const mongoose = require('mongoose');
const { roleActionSchema } = require('./schemas/actionSchema');

const rolePermissionSchema = new mongoose.Schema({
  permission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    required: true
  },
  actions: [roleActionSchema]
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  permissions: [rolePermissionSchema],
  isSystemRole: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

roleSchema.index({ name: 1 }, { unique: true });
roleSchema.index({ isActive: 1 });

roleSchema.pre('findOneAndDelete', function(next) {
  const query = this.getQuery();
  if (query.isSystemRole === true || query.name === 'superadmin') {
    throw new Error('Cannot delete system roles');
  }
  next();
});

roleSchema.pre('deleteOne', function(next) {
  const query = this.getQuery();
  if (query.isSystemRole === true || query.name === 'superadmin') {
    throw new Error('Cannot delete system roles');
  }
  next();
});

module.exports = mongoose.model('Role', roleSchema);