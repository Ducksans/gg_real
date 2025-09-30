export const titleCase = (value: string): string =>
  value
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const normalizePadding = (
  padding?: Partial<{ top: number; right: number; bottom: number; left: number }> | null,
) => {
  const { top = 0, right = 0, bottom = 0, left = 0 } = padding ?? {};
  return { top, right, bottom, left };
};
