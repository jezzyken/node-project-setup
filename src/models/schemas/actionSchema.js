const mongoose = require('mongoose');

const baseActionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const roleActionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  allowed: {
    type: Boolean,
    required: true,
    default: false
  }
}, { _id: false });

module.exports = {
  baseActionSchema,
  roleActionSchema
};