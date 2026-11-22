-- Adiciona controle server-side de pausa do cronômetro durante a fala final de aprovação
ALTER TABLE "partidas"
  ADD COLUMN "pausa_ms_acumulados" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "pausado_desde" TIMESTAMP(3),
  ADD COLUMN "pausa_maxima_ate" TIMESTAMP(3);
