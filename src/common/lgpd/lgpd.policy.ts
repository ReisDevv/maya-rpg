/**
 * Política de privacidade / LGPD da Clínica Maya.
 *
 * - CURRENT_VERSION: incrementar quando o conteúdo do termo for atualizado.
 *   Usuários cujo `lgpdAcceptedVersion` ficar diferente da versão atual
 *   serão obrigados a aceitar o novo termo no próximo login.
 *
 * - DATA_RETENTION_YEARS: prazo de retenção dos dados clínicos sensíveis,
 *   alinhado às melhores práticas para prontuários (mínimo 20 anos para
 *   prontuário médico segundo o CFM; aqui usamos 5 anos por se tratar de RPG).
 *   Após esse prazo, dados podem ser anonimizados ou removidos a pedido.
 */
export const LgpdPolicy = {
  CURRENT_VERSION: '1.0.0',
  DATA_RETENTION_YEARS: 5,
} as const;
