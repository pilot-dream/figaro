import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { supabaseAdmin } from '../lib/supabaseAdmin'

const prisma = new PrismaClient()

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  slug?: string
  commissionType?: string
  commissionValue?: number
  ownerId?: string
  subscriptionPlan?: string
  parentId?: string
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser
}

// 4. Autenticação e validação do JWT via Supabase Auth
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      console.error('Supabase Auth Error:', error)
      return res.status(401).json({ error: 'Token inválido ou expirado' })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser) {
      console.error('User not found in DB:', user.id)
      return res.status(401).json({ error: 'Usuário não encontrado no banco' })
    }

    req.user = {
      id: dbUser.id,
      email: user.email || '',
      role: dbUser.role,
      slug: dbUser.slug || undefined,
      commissionType: dbUser.commissionType,
      commissionValue: dbUser.commissionValue,
      ownerId: dbUser.ownerId || undefined,
      subscriptionPlan: dbUser.subscriptionPlan,
      parentId: dbUser.parentId || undefined
    }
    
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Erro ao validar token' })
  }
}

// 4. Autorização por Roles Múltiplas (ex: checkRole(['BARBEIRO']))
export function checkRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }
    
    // O sistema atual usa 'BARBER'. Mapear 'BARBEIRO' para 'BARBER' e vice versa para garantir compatibilidade
    const userRole = req.user.role;
    const normalizedRole = userRole === 'BARBER' ? 'BARBEIRO' : userRole;
    
    if (!allowedRoles.includes(userRole) && !allowedRoles.includes(normalizedRole)) {
      return res.status(403).json({ error: 'Acesso negado para este perfil' })
    }
    next()
  }
}

// Compatibilidade com rotas já existentes que usavam requireAuth e requireRole
export const requireAuth = authMiddleware;
export function requireRole(allowedRole: string) {
  return checkRole([allowedRole]);
}
