import { createHash, randomBytes, randomInt } from 'crypto';

/**
 * Returns null if the password meets requirements, or an error message string.
 * Requirements: min 8 chars, at least 1 uppercase letter, 1 lowercase letter, 1 digit.
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8) {
    return 'Senha deve ter no mínimo 8 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Senha deve conter ao menos uma letra maiúscula';
  }
  if (!/[a-z]/.test(password)) {
    return 'Senha deve conter ao menos uma letra minúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'Senha deve conter ao menos um número';
  }
  return null;
}

/** Generates a cryptographically secure 8-digit numeric code. */
export function generateNumericCode(): string {
  return String(randomInt(10000000, 100000000));
}

/** SHA-256 hash of an arbitrary value. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Cryptographically secure random hex token of the given byte length. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
