-- Garante que eventuais registros duplicados EM_ANDAMENTO pré-existentes sejam normalizados
-- mantendo apenas a partida mais recente por jogador antes de criar o índice único parcial.
WITH partidas_ordenadas AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "jogador_id"
      ORDER BY "iniciado_em" DESC, "criado_em" DESC
    ) AS rn
  FROM "partidas"
  WHERE "status" = 'EM_ANDAMENTO'
)
UPDATE "partidas"
SET "status" = 'CANCELADA', "finalizado_em" = NOW()
WHERE "id" IN (
  SELECT "id" FROM partidas_ordenadas WHERE rn > 1
);

-- Índice único parcial: garante no próprio PostgreSQL no máximo 1 partida EM_ANDAMENTO por jogador
CREATE UNIQUE INDEX "partidas_unica_em_andamento_por_jogador"
ON "partidas" ("jogador_id")
WHERE ("status" = 'EM_ANDAMENTO');
