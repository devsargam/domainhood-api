import { z } from 'zod';

export const signUpSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
  })
  .required();

export type SignUpDto = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  username: z.string().email(),
  password: z.string().min(8),
});

export type SignInDto = z.infer<typeof signInSchema>;
