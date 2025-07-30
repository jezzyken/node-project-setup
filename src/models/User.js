const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  passwordHash: {
    type: String,
    minlength: 10
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordHash;
      delete ret.refreshTokens;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordHash;
      delete ret.refreshTokens;
      return ret;
    }
  }
});

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: 1 }); 

userSchema.pre('save', async function(next) {
  if (this.username === 'superadmin') {
    const Role = mongoose.model('Role');
    const superadminRole = await Role.findOne({ name: 'superadmin' });
    
    if (superadminRole) {
      const superadminCount = await mongoose.model('User').countDocuments({ 
        role: superadminRole._id,
        _id: { $ne: this._id }
      });
      
      if (superadminCount >= 1) {
        throw new Error('Only one superadmin account is allowed');
      }
    }
  }

  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.password, salt);
});

userSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (this.getQuery().username === 'superadmin' || (update && update.username === 'superadmin')) {
    throw new Error('Superadmin account cannot be modified');
  }
  next();
});

userSchema.pre('findOneAndDelete', function(next) {
  if (this.getQuery().username === 'superadmin') {
    throw new Error('Superadmin account cannot be deleted');
  }
  next();
});

userSchema.pre('deleteOne', function(next) {
  if (this.getQuery().username === 'superadmin') {
    throw new Error('Superadmin account cannot be deleted');
  }
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.methods.isSuperAdmin = function() {
  return this.populated('role') && this.role && this.role.name === 'superadmin';
};

module.exports = mongoose.model('User', userSchema);