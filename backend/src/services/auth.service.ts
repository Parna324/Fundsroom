import bcrypt from 'bcrypt';
import { findUserByEmail } from '../repositories/user.repository';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/response';

export async function loginService(email: string, password: string) {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const { password_hash: _, ...userPublic } = user;

  return { user: userPublic, token };
}
