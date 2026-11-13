/*
  Warnings:

  - You are about to drop the `Attempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Challenge` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChallengeOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DisabledOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Player` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "ChallengeOption" DROP CONSTRAINT "ChallengeOption_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "DisabledOption" DROP CONSTRAINT "DisabledOption_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_playerId_fkey";

-- DropTable
DROP TABLE "Attempt";

-- DropTable
DROP TABLE "Challenge";

-- DropTable
DROP TABLE "ChallengeOption";

-- DropTable
DROP TABLE "DisabledOption";

-- DropTable
DROP TABLE "Player";

-- DropTable
DROP TABLE "Session";

-- CreateTable
CREATE TABLE "jogadores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "senha" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jogadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partidas" (
    "id" TEXT NOT NULL,
    "jogador_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "iniciado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado_em" TIMESTAMP(3),
    "segundos_reais" INTEGER NOT NULL DEFAULT 0,
    "segundos_penalidade" INTEGER NOT NULL DEFAULT 0,
    "segundos_totais" INTEGER NOT NULL DEFAULT 0,
    "total_erros" INTEGER NOT NULL DEFAULT 0,
    "etapa_atual" INTEGER NOT NULL DEFAULT 0,
    "membros_concluidos" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desafios" (
    "id" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "rotulo_curto" TEXT NOT NULL,
    "posicao_mesa" TEXT NOT NULL,
    "gradiente_avatar" TEXT NOT NULL,
    "cor_borda" TEXT NOT NULL,
    "cor_brilho" TEXT NOT NULL,
    "cor_badge" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'multiple_choice',
    "saudacao" TEXT NOT NULL,
    "pergunta" TEXT NOT NULL,
    "mensagem_aprovacao" TEXT NOT NULL,

    CONSTRAINT "desafios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opcoes_desafio" (
    "id" TEXT NOT NULL,
    "desafio_id" INTEGER NOT NULL,
    "opcao_id" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL,

    CONSTRAINT "opcoes_desafio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opcoes_desabilitadas" (
    "id" TEXT NOT NULL,
    "partida_id" TEXT NOT NULL,
    "membro_id" INTEGER NOT NULL,
    "opcao_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opcoes_desabilitadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tentativas" (
    "id" TEXT NOT NULL,
    "partida_id" TEXT NOT NULL,
    "desafio_id" INTEGER NOT NULL,
    "opcao_selecionada" TEXT NOT NULL,
    "acertou" BOOLEAN NOT NULL,
    "penalidade_aplicada" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tentativas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "jogadores_email_key" ON "jogadores"("email");

-- CreateIndex
CREATE INDEX "jogadores_email_idx" ON "jogadores"("email");

-- CreateIndex
CREATE INDEX "jogadores_setor_idx" ON "jogadores"("setor");

-- CreateIndex
CREATE INDEX "jogadores_unidade_idx" ON "jogadores"("unidade");

-- CreateIndex
CREATE INDEX "partidas_jogador_id_idx" ON "partidas"("jogador_id");

-- CreateIndex
CREATE INDEX "partidas_status_idx" ON "partidas"("status");

-- CreateIndex
CREATE INDEX "partidas_segundos_totais_idx" ON "partidas"("segundos_totais");

-- CreateIndex
CREATE INDEX "opcoes_desafio_desafio_id_idx" ON "opcoes_desafio"("desafio_id");

-- CreateIndex
CREATE UNIQUE INDEX "opcoes_desafio_desafio_id_opcao_id_key" ON "opcoes_desafio"("desafio_id", "opcao_id");

-- CreateIndex
CREATE INDEX "opcoes_desabilitadas_partida_id_idx" ON "opcoes_desabilitadas"("partida_id");

-- CreateIndex
CREATE UNIQUE INDEX "opcoes_desabilitadas_partida_id_membro_id_opcao_id_key" ON "opcoes_desabilitadas"("partida_id", "membro_id", "opcao_id");

-- CreateIndex
CREATE INDEX "tentativas_partida_id_idx" ON "tentativas"("partida_id");

-- CreateIndex
CREATE INDEX "tentativas_desafio_id_idx" ON "tentativas"("desafio_id");

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcoes_desafio" ADD CONSTRAINT "opcoes_desafio_desafio_id_fkey" FOREIGN KEY ("desafio_id") REFERENCES "desafios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcoes_desabilitadas" ADD CONSTRAINT "opcoes_desabilitadas_partida_id_fkey" FOREIGN KEY ("partida_id") REFERENCES "partidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativas" ADD CONSTRAINT "tentativas_partida_id_fkey" FOREIGN KEY ("partida_id") REFERENCES "partidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentativas" ADD CONSTRAINT "tentativas_desafio_id_fkey" FOREIGN KEY ("desafio_id") REFERENCES "desafios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
