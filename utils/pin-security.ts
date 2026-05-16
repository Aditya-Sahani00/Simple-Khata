/**
 * PIN/Password hashing utilities
 * This uses a simple deterministic hash for basic PIN verification
 * For production, consider using 'bcryptjs' for stronger security
 */

/**
 * Simple deterministic hash function
 * Creates consistent hashes suitable for PIN verification
 */
function simpleHash(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16) + pin.length.toString(16);
}

/**
 * Hash a PIN for storage
 * @param pin - The PIN to hash
 * @returns Promise<string> - The hashed PIN
 */
export async function hashPin(pin: string): Promise<string> {
  try {
    return simpleHash(pin);
  } catch (error) {
    console.error('Error hashing PIN:', error);
    throw new Error('Failed to hash PIN');
  }
}

/**
 * Verify a PIN against a hash
 * @param pin - The PIN to verify
 * @param hash - The stored hash
 * @returns Promise<boolean> - Whether the PIN matches
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  try {
    const newHash = await hashPin(pin);
    return newHash === hash;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
}

/**
 * Validate PIN strength
 * Requirements:
 * - At least 4 digits
 * - At most 6 digits
 * - All numeric characters
 */
export function validatePinStrength(pin: string): { isValid: boolean; error?: string } {
  if (!pin) {
    return { isValid: false, error: 'PIN is required' };
  }
  
  if (!/^\d+$/.test(pin)) {
    return { isValid: false, error: 'PIN must contain only digits' };
  }
  
  if (pin.length < 4) {
    return { isValid: false, error: 'PIN must be at least 4 digits' };
  }
  
  if (pin.length > 6) {
    return { isValid: false, error: 'PIN must be at most 6 digits' };
  }
  
  return { isValid: true };
}

/**
 * Generate a random PIN for suggestions
 */
export function generateRandomPin(): string {
  const length = 4 + Math.floor(Math.random() * 3); // 4-6 digits
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}
