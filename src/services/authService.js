const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

class AuthService {
  async register(userData) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error('Email already registered');
      error.status = 409;
      throw error;
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = await userRepository.create({
      ...userData,
      password: hashedPassword
    });

    // Remove password before returning
    const userJson = newUser.toObject();
    delete userJson.password;
    return userJson;
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user || user.status === 'Inactive') {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const token = this.generateToken(user);

    const userJson = user.toObject();
    delete userJson.password;

    return { user: userJson, token };
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      const err = new Error('Invalid credentials');
      err.status = 400;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRepository.updatePassword(userId, hashedPassword);
    return { message: 'Password changed successfully' };
  }

  generateToken(user) {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
  }
}

module.exports = new AuthService();
