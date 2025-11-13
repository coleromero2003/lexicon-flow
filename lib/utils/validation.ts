/**
 * Validation utilities for sanitizing and validating user input
 */

/**
 * Sanitizes plain text by removing HTML tags and normalizing whitespace
 * @param value - The string to sanitize
 * @returns Sanitized string with HTML removed and whitespace normalized
 */
export function sanitizePlainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
}

/**
 * Sanitizes project code by applying plain text sanitization
 * @param value - The code string to sanitize
 * @returns Sanitized code string
 */
export function sanitizeProjectCode(value: string): string {
  return sanitizePlainText(value);
}

/**
 * Validates project code format
 * @param code - The code to validate
 * @returns True if code matches pattern, false otherwise
 */
export function isValidProjectCode(code: string): boolean {
  const CODE_PATTERN = /^[A-Za-z0-9_-]{0,20}$/;
  return CODE_PATTERN.test(code);
}

// Common validation constants
export const MAX_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_CODE_LENGTH = 20;
