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

export const userUpdateSchema = registerSchema
  .pick({
    name: true,
    password: true,
  })
  .partial()
  .refine((value) =>
    Object.values(value).some((field) => typeof field === "string" && field.trim().length > 0),
  {
    message: "Informe ao menos um campo para atualizar",
  });

export const directMessageSchema = z.object({
  recipientId: z.string().min(1, "Destinatário obrigatório"),
  body: z
    .string()
    .trim()
    .min(1, "Mensagem muito curta")
    .max(2000, "Mensagem muito longa"),
});

export const friendRequestSchema = z.object({
  friendId: z.string().min(1, "Usuário inválido"),
});
