-- Converte dias (text contendo JSON serializado) para jsonb preservando dados.
ALTER TABLE "jornadas" ALTER COLUMN "dias" TYPE JSONB USING "dias"::jsonb;
