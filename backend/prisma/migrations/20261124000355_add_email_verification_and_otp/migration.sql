-- AlterTable
ALTER TABLE "jogadores" ADD COLUMN     "email_verificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "email_verificado_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "codigos_verificacao" (
    "id" TEXT NOT NULL,
    "jogador_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "finalidade" TEXT NOT NULL,
    "codigo_hash" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "max_tentativas" INTEGER NOT NULL DEFAULT 5,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "consumido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigos_verificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "codigos_verificacao_email_finalidade_idx" ON "codigos_verificacao"("email", "finalidade");

-- CreateIndex
CREATE INDEX "codigos_verificacao_jogador_id_idx" ON "codigos_verificacao"("jogador_id");

-- CreateIndex
CREATE INDEX "codigos_verificacao_expira_em_idx" ON "codigos_verificacao"("expira_em");

-- AddForeignKey
ALTER TABLE "codigos_verificacao" ADD CONSTRAINT "codigos_verificacao_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mantém contas pré-existentes de dev/teste utilizáveis (sem efeito em banco de produção novo)
UPDATE "jogadores"
SET "email_verificado" = true, "email_verificado_em" = NOW()
WHERE "email_verificado" = false;
