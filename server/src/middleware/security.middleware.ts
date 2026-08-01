import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// 1. Helmet e segurança de headers (Blindagem de Cabeçalhos)
export const securityHeaders = helmet({
  // Ocultar a stack da tecnologia (X-Powered-By)
  hidePoweredBy: true,
  // Políticas rigorosas de CSP
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // Proteção contra Clickjacking
  frameguard: {
    action: 'deny',
  },
  // Proteção contra XSS
  xssFilter: true,
  // Forçar HTTPS (HSTS)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
});

// 3. Rate Limiting (Proteção contra Abuso e DDoS)
// a) Limite global: Máximo de 100 requisições a cada 15 minutos por IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
  }
});

// b) Limite estrito de autenticação: Máximo de 5 tentativas a cada 15 minutos para rotas de login
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de login deste IP, tente novamente em 15 minutos.'
  }
});

// c) Limite estrito de agendamento público: Máximo de 5 agendamentos por hora por IP
// Impede que bots preencham a agenda do barbeiro com dados falsos.
export const bookingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de agendamentos atingido. Tente novamente em 1 hora.'
  }
});
