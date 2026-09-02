import { z } from "zod";

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Add one capital letter")
  .regex(/[a-z]/, "Add one small letter")
  .regex(/[^A-Za-z0-9]/, "Add one symbol");

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
    password,
    confirm_password: z.string(),
  })
  .refine((value) => value.password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

export const memberLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z.string().min(1, "Enter your password").max(128),
});

export const memberProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
});

export const memberPasswordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password").max(128),
    new_password: password,
    confirm_password: z.string(),
  })
  .refine((value) => value.new_password === value.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });
