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

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.get('JWT_SECRET')) as AuthenticatedUser
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

export function requireRole(allowedRole: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }
    if (req.user.role !== allowedRole) {
      return res.status(403).json({ error: 'Acesso negado para este perfil' })
    }
    next()
  }
}
