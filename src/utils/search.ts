export function normalizeSearchValue(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function matchesSearchQuery(values: unknown[], query: string): boolean {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  return values.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
}
