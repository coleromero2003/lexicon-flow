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

// Common validation constants
export const MAX_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_CODE_LENGTH = 20;
