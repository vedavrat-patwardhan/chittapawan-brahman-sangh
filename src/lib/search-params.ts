export type RawSearchParams = Record<string, string | string[] | undefined>;

export function qp(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = v?.trim();
  return trimmed ? trimmed : undefined;
}
