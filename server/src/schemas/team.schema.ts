import { z } from 'zod'

export const createTeamMemberSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido').max(100, 'Email muito longo'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(50, 'Senha muito longa'),
  phone: z.string().min(10, 'Telefone inválido').max(20, 'Telefone muito longo').optional().nullable(),
  avatarUrl: z.string().url('URL de avatar inválida').optional().nullable(),
  specialty: z.string().max(50, 'Especialidade muito longa').optional().nullable(),
  role: z.enum(['BARBER', 'OWNER', 'MANAGER']).optional().default('BARBER'),
  commissionType: z.enum(['PERCENTAGE', 'FIXED']).optional().default('PERCENTAGE'),
  commissionValue: z.number().min(0, 'Valor não pode ser negativo').optional().default(0)
})
