/**
 * Authentication helper utilities
 * Extracted from routes.ts for clarity and reusability
 */

import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * User type with password field
 */
interface UserWithPassword {
  id: string;
  password: string;
  [key: string]: any;
}

/**
 * User type without password field
 */
export type UserWithoutPassword<T extends UserWithPassword> = Omit<T, "password">;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Remove password field from a user object
 * Returns a new object without mutating the original
 */
export function excludePassword<T extends UserWithPassword>(
  user: T
): UserWithoutPassword<T> {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as UserWithoutPassword<T>;
}

/**
 * Remove password field from an array of user objects
 */
export function excludePasswordFromAll<T extends UserWithPassword>(
  users: T[]
): UserWithoutPassword<T>[] {
  return users.map(excludePassword);
}

/**
 * Validate password meets minimum requirements
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  return { valid: true };
}

/**
 * Set up user session after successful authentication
 */
export function setUserSession(
  session: { userId?: string; userRole?: string },
  user: { id: string; role: string }
): void {
  session.userId = user.id;
  session.userRole = user.role;
}
