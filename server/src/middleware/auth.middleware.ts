import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/env'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  slug?: string
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser
}

// 4. Autenticação e validação do JWT
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.get('JWT_SECRET')) as AuthenticatedUser
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
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
