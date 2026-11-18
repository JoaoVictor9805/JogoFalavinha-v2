-- AlterTable
ALTER TABLE "partidas" ADD COLUMN     "combo_atual" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cronometro_iniciado_em" TIMESTAMP(3),
ADD COLUMN     "segundos_bonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_combos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimo_sync_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "bloqueios_conselheiros" (
    "id" TEXT NOT NULL,
    "partida_id" TEXT NOT NULL,
    "membro_id" INTEGER NOT NULL,
    "bloqueado_ate" TIMESTAMP(3),
    "vezes_bloqueado" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloqueios_conselheiros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bloqueios_conselheiros_partida_id_idx" ON "bloqueios_conselheiros"("partida_id");

-- CreateIndex
CREATE UNIQUE INDEX "bloqueios_conselheiros_partida_id_membro_id_key" ON "bloqueios_conselheiros"("partida_id", "membro_id");

-- AddForeignKey
ALTER TABLE "bloqueios_conselheiros" ADD CONSTRAINT "bloqueios_conselheiros_partida_id_fkey" FOREIGN KEY ("partida_id") REFERENCES "partidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
