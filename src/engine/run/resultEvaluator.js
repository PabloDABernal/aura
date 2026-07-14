export function evaluateResult(difference, margin) {
  if (difference <= margin * 0.5) return 'perfect';
  if (difference <= margin) return 'pass';
  return 'fail';
}
