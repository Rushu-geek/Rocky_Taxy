/**
 * Capitalizes the first letter of each word in a string.
 * Used for formatting user names (Firstname Lastname).
 */
export const formatName = (name?: string): string => {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
