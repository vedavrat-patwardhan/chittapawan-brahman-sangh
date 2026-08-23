import { z } from "zod";

export const adminProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  current_password: z.string().min(1, "Current password is required").max(256),
});

export const adminPasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required").max(256),
    new_password: z
      .string()
      .min(14, "Use at least 14 characters")
      .max(256)
      .regex(/[a-z]/, "Add a lowercase letter")
      .regex(/[A-Z]/, "Add an uppercase letter")
      .regex(/[0-9]/, "Add a number")
      .regex(/[^A-Za-z0-9]/, "Add a symbol"),
    confirm_password: z.string().max(256),
  })
  .refine((value) => value.new_password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });
