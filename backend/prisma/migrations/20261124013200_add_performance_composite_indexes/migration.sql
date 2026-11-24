-- CreateIndex
CREATE INDEX "partidas_jogador_id_status_idx" ON "partidas"("jogador_id", "status");

-- CreateIndex
CREATE INDEX "tentativas_partida_id_acertou_criado_em_idx" ON "tentativas"("partida_id", "acertou", "criado_em");

-- CreateIndex
CREATE INDEX "tentativas_partida_id_desafio_id_acertou_idx" ON "tentativas"("partida_id", "desafio_id", "acertou");
