const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const catchAsync = require('../utils/catchAsync');

const register = catchAsync(async (req, res, next) => {
  const { username, email, password, firstName, lastName, role } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists'
    });
  }

  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName,
    role
  });

  const accessToken = generateAccessToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
});

const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide username and password'
    });
  }

  const user = await User.findOne({
    $or: [{ email: username }, { username }]
  }).select('+passwordHash');

  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  const accessToken = generateAccessToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  // Replace all refresh tokens with the new one (single device login)
  user.refreshTokens = [{ token: refreshToken }];
  user.lastLogin = new Date();
  await user.save();

  user.passwordHash = undefined;

  res.status(200).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
});

const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token required'
    });
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }

  const tokenExists = user.refreshTokens.some(token => token.token === refreshToken);

  if (!tokenExists) {
    return res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }

  const newAccessToken = generateAccessToken({ id: user._id });
  const newRefreshToken = generateRefreshToken({ id: user._id });

  user.refreshTokens = user.refreshTokens.filter(token => token.token !== refreshToken);
  user.refreshTokens.push({ token: newRefreshToken });
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
  });
});

const logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  const user = await User.findById(req.user._id);

  if (refreshToken) {
    user.refreshTokens = user.refreshTokens.filter(token => token.token !== refreshToken);
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: user
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe
};