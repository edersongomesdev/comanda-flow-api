export function trimStringInput(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export function emptyStringToNull(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
