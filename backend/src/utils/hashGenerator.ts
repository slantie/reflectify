export function generateHash(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}
