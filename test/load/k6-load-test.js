import http from 'k6/http';
import { check, sleep } from 'k6';

http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 401, 429),
);

// Configuração do Teste de Carga (DevOps / Qualidade de Software)
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Rampa de subida para 20 usuários simultâneos em 30 segundos
    { duration: '1m', target: 20 },  // Mantém os 20 usuários constantes por 1 minuto
    { duration: '30s', target: 0 },  // Rampa de descida de volta para 0 usuários
  ],
  thresholds: {
    // Requisitos mínimos de aceitação (Quality Attributes)
    http_req_duration: ['p(95)<500'], // 95% das requisições devem ser respondidas em menos de 500ms
    http_req_failed: ['rate<0.01'],   // A taxa de falha deve ser menor que 1% (idealmente 0 no happy path)
  },
};

export default function () {
  // Ajuste a URL se estiver rodando em outro local (ex: AWS, Heroku, etc)
  const BASE_URL = 'http://localhost:3000/api';

  // 1. Testa a rota Pública (Login) para gerar carga no banco e no Rate Limiter (Throttler)
  // Utilizamos dados fictícios. Isso vai retornar 401 Unauthorized, mas vai passar pela infraestrutura completa.
  const payload = JSON.stringify({
    email: 'stress-test@example.com',
    password: 'wrongpassword123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/auth/login`, payload, params);

  // Valida que o servidor não travou (500) e sim respondeu as regras de negócio corretamente
  // Status esperado: 401 (Credenciais Inválidas) ou 429 (Too Many Requests devido ao Throttler)
  check(res, {
    'status é 401 ou 429 (Servidor Resiliente)': (r) => r.status === 401 || r.status === 429,
  });

  // Simula o tempo de "pensamento" (think time) de um usuário real mexendo no aplicativo
  sleep(1);
}
