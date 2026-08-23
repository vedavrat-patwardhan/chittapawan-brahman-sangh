export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeBusinessName(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizedMemberIdentity(input: {
  email: string;
  contact_number: string;
  business_name: string;
}) {
  return {
    email_normalized: normalizeEmail(input.email),
    contact_number_normalized: normalizePhone(input.contact_number),
    business_name_normalized: normalizeBusinessName(input.business_name),
  };
}
