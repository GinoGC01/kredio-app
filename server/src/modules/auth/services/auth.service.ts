import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { authModel } from '../models/auth.model.js';
import { RegisterDto, LoginDto } from '../types/auth.types.js';

const googleClient = new OAuth2Client();

export const authService = {
  register: async (data: RegisterDto): Promise<{ id: string; email: string; name: string }> => {
    const existing = await authModel.findByEmail(data.email);
    if (existing) {
      console.warn(`[AUTH] Registration failed: email already registered - ${data.email}`);
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await authModel.create({
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      password: hashedPassword,
    });

    console.log(`[AUTH] New user registered: ${user.email} (${user.id})`);

    return user;
  },

  login: async (data: LoginDto): Promise<{ id: string; email: string; name: string }> => {
    const email = data.email.toLowerCase().trim();
    const user = await authModel.findByEmail(email);

    if (!user) {
      console.warn(`[AUTH] Login failed: user not found - ${email}`);
      throw new AppError('Invalid email or password', 401);
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      console.warn(`[AUTH] Login failed: invalid password - ${email}`);
      throw new AppError('Invalid email or password', 401);
    }

    console.log(`[AUTH] Login successful: ${email} (${user.id})`);

    await authModel.updateLastActivity(user.id);

    return { id: user.id, email: user.email, name: user.name };
  },

  googleAuth: async (credential: string): Promise<{ id: string; email: string; name: string }> => {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      console.warn('[AUTH] Google login failed: invalid token payload');
      throw new AppError('Invalid Google credential', 401);
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name?.trim() || email.split('@')[0];

    const existing = await authModel.findByEmail(email);

    if (existing) {
      await authModel.updateLastActivity(existing.id);
      console.log(`[AUTH] Google login successful: ${email} (${existing.id})`);
      return { id: existing.id, email: existing.email, name: existing.name };
    }

    const randomPassword = await bcrypt.hash(crypto.randomUUID(), 12);
    const newUser = await authModel.create({ email, name, password: randomPassword });
    await authModel.updateLastActivity(newUser.id);
    console.log(`[AUTH] New user created via Google: ${email} (${newUser.id})`);

    return { id: newUser.id, email: newUser.email, name: newUser.name };
  },

  getProfile: async (userId: string) => {
    const user = await authModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  },
};
