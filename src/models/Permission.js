const mongoose = require('mongoose');
const { baseActionSchema } = require('./schemas/actionSchema');

const permissionSchema = new mongoose.Schema({
  resource: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  actions: {
    type: [baseActionSchema],
    required: true,
    validate: {
      validator: function(actions) {
        return actions.length > 0;
      },
      message: 'Permission must have at least one action'
    }
  }
}, {
  timestamps: true
});

permissionSchema.index({ resource: 1 });

module.exports = mongoose.model('Permission', permissionSchema);