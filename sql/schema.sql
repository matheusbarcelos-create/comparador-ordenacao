-- Compatível com o banco da versão anterior (comparador_ordenacao).
CREATE TABLE IF NOT EXISTS vetores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dados_desordenados JSON NOT NULL,
  tamanho INT UNSIGNED NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resultados (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  vetor_id BIGINT UNSIGNED NOT NULL,
  algoritmo VARCHAR(32) NOT NULL,
  dados_ordenados JSON NOT NULL,
  tempo_ms DOUBLE NOT NULL,
  repeticoes SMALLINT UNSIGNED NOT NULL,
  amostras_ms JSON NOT NULL,
  valido TINYINT(1) NOT NULL DEFAULT 1,
  executado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vetor_algoritmo (vetor_id, algoritmo),
  KEY idx_ranking (vetor_id, tempo_ms),
  CONSTRAINT fk_resultados_vetores FOREIGN KEY (vetor_id)
    REFERENCES vetores(id) ON DELETE CASCADE
) ENGINE=InnoDB;
