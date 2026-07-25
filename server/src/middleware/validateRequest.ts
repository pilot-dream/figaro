import type { Request, Response, NextFunction } from 'express'
import type { ZodType } from 'zod'
import { ZodError } from 'zod'

/**
 * Middleware genérico de validação com Zod v4.
 *
 * Recebe schemas opcionais para body, query e params.
 * Se a validação falhar, retorna 400 com erros formatados.
 * Se passar, sobrescreve req.body / req.query / req.params
 * com os dados já parseados e sanitizados pelo Zod.
 */
interface ValidationSchemas {
  body?: ZodType
  query?: ZodType
  params?: ZodType
}

export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: { field: string; message: string }[] = []

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body)
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: `body.${issue.path.join('.')}`,
            message: issue.message,
          })
        }
      } else {
        req.body = result.data
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query)
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: `query.${issue.path.join('.')}`,
            message: issue.message,
          })
        }
      } else {
        ;(req as any).query = result.data
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params)
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: `params.${issue.path.join('.')}`,
            message: issue.message,
          })
        }
      } else {
        req.params = result.data as any
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Dados inválidos na requisição',
        details: errors,
      })
    }

    next()
  }
}
