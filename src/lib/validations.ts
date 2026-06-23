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

export type ActionResult = {
  errors?: Record<string, string[]>;
  message?: string;
  success: boolean;
};

// ── Post & Project schemas ──

export const PostSchema = z.object({
  title: z.string().min(1, "标题不能为空").trim(),
  slug: z
    .string()
    .min(1, "Slug 不能为空")
    .regex(/^[a-z0-9-]+$/, "Slug 只能包含小写字母、数字和连字符")
    .trim(),
  excerpt: z.string().trim().optional(),
  content: z.string().optional(),
  category: z.string().trim().optional(),
  published: z.boolean().optional(),
});

export const ProjectSchema = z.object({
  title: z.string().min(1, "标题不能为空").trim(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  status: z.string().optional(),
  url: z.string().trim().optional(),
  github: z.string().trim().optional(),
  techs: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "[]") return true;
        try { const parsed = JSON.parse(val); return Array.isArray(parsed); }
        catch { return false; }
      },
      { message: "技术栈必须是 JSON 数组格式，例如：[\"React\", \"TypeScript\"]" }
    ),
  sortOrder: z.coerce.number().optional(),
});
