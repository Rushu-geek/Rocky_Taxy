import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';

const generateToken = (id: string, role: string): string => {
  const options: SignOptions = {
    expiresIn: (env.jwtExpiresIn as SignOptions['expiresIn']),
  };
  return jwt.sign({ id, role }, env.jwtSecret, options);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role } = req.body;

    console.log("register api hit <<<<<<", name, email, phone, password, role);

    if (!name || !email || !phone || !password || !role) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

    const existingUser = await userRepository.findByEmail(email);

    console.log("existing user <<<<<<", existingUser);

    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered.' });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await userRepository.create({ name, email, phone, password, role } as any);

    console.log("user created <<<<<<", user);

    const token = generateToken(String(user._id), user.role);

    console.log("token generated <<<<<<", token);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAvailable: user.isAvailable,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    console.log("login api hit <<<<<<", email, password);

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await userRepository.findByEmail(email);
    console.log("user found <<<<<<", user);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    const token = generateToken(String(user._id), user.role);

    res.json({
      success: true,
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAvailable: user.isAvailable,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userRepository.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAvailable: user.isAvailable,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user.' });
  }
};

export const updateFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      res.status(400).json({ success: false, message: 'FCM token is required.' });
      return;
    }
    await userRepository.updateFcmToken(req.user!.id, fcmToken as string);
    res.json({ success: true, message: 'FCM token updated.' });
  } catch (error) {
    console.error('UpdateFcmToken error:', error);
    res.status(500).json({ success: false, message: 'Server error updating FCM token.' });
  }
};
