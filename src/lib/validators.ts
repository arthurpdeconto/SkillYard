import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Use pelo menos 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export const postCreateSchema = z.object({
  title: z.string().min(3, "Título muito curto"),
  content: z.string().min(10, "Conteúdo muito curto"),
  published: z.boolean().default(true),
});

export const postUpdateSchema = postCreateSchema
  .partial({
    title: true,
    content: true,
    published: true,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Forneça ao menos um campo para atualizar",
  });
