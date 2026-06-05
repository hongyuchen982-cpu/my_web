import { z } from "zod";

export const SignupSchema = z.object({
  name: z
    .string()
    .min(2, { message: "名字至少 2 个字符" })
    .trim(),
  email: z
    .string()
    .email({ message: "请输入有效的邮箱地址" })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, { message: "密码至少 8 个字符" })
    .regex(/[a-zA-Z]/, { message: "密码必须包含至少一个字母" })
    .regex(/[0-9]/, { message: "密码必须包含至少一个数字" }),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .email({ message: "请输入有效的邮箱地址" })
    .trim()
    .toLowerCase(),
  password: z.string().min(1, { message: "请输入密码" }),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

export type AuthResult = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};
