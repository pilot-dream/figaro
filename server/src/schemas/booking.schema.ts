import { z } from 'zod'

/**
 * Regex para telefone brasileiro: (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX
 * Aceita com ou sem parênteses/espaços/traço para flexibilidade do frontend.
 */
const PHONE_REGEX = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/

/**
 * Schema de criação de agendamento público (body).
 *
 * Regras de negócio:
 * - barberId obrigatório e UUID válido (o frontend já envia)
 * - serviceIds: pelo menos 1 serviço selecionado, todos UUID
 * - startTime: ISO 8601 válido e no futuro
 * - clientName: mínimo 2 caracteres
 * - clientPhone: formato brasileiro válido
 * - clientId: opcional (cliente logado)
 * - notes: texto livre até 500 chars
 * - recurringType: enum controlado
 */
export const createBookingBodySchema = z.object({
  barberId: z
    .string({ error: 'O barbeiro é obrigatório' })
    .uuid('ID do barbeiro inválido'),

  serviceIds: z
    .array(z.string().uuid('ID de serviço inválido'))
    .min(1, 'Selecione pelo menos 1 serviço'),

  startTime: z
    .string({ error: 'Horário de início é obrigatório' })
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Formato de data/hora inválido (use ISO 8601)'
    )
    .refine(
      (val) => new Date(val) > new Date(),
      'O horário de início deve ser no futuro'
    ),

  clientId: z
    .string()
    .uuid('ID do cliente inválido')
    .optional()
    .nullable(),

  clientName: z
    .string({ error: 'Nome do cliente é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .trim(),

  clientPhone: z
    .string({ error: 'WhatsApp é obrigatório' })
    .regex(PHONE_REGEX, 'Formato de telefone inválido. Ex: (11) 99999-9999'),

  notes: z
    .string()
    .max(500, 'Observação muito longa (máx 500 caracteres)')
    .optional()
    .default(''),

  recurringType: z
    .enum(['NONE', 'BIWEEKLY', 'MONTHLY'])
    .optional()
    .default('NONE'),
})

/** Schema de query para buscar disponibilidade */
export const availabilityQuerySchema = z.object({
  date: z
    .string({ error: 'A data é obrigatória' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (use YYYY-MM-DD)'),

  durationMin: z
    .string({ error: 'A duração é obrigatória' })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Duração deve ser um número positivo'),

  barberId: z
    .string()
    .uuid('ID do barbeiro inválido')
    .optional(),
})

/** Schema de params para rotas com slug */
export const barberSlugParamsSchema = z.object({
  slug: z
    .string({ error: 'Slug é obrigatório' })
    .min(2, 'Slug inválido')
    .max(80, 'Slug muito longo')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
})

export type CreateBookingInput = z.infer<typeof createBookingBodySchema>
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>
