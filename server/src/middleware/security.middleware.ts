import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// 1. Helmet e segurança de headers
export const securityHeaders = helmet();

// 3. Rate Limiting (Proteção contra Brute-Force e DDoS)
// a) Limite global: Máximo de 100 requisições a cada 15 minutos
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
