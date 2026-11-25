-- Remove tabela de códigos OTP e colunas de verificação de e-mail para o ambiente de homologação
DROP TABLE IF EXISTS "codigos_verificacao";

ALTER TABLE "jogadores"
  DROP COLUMN IF EXISTS "email_verificado",
  DROP COLUMN IF EXISTS "email_verificado_em";
