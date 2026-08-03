-- Memory Engine — no-vector retrieval indexes.
-- pg_trgm powers fast ILIKE '%kw%' on title/summary; the tags GIN powers
-- fast `tags && ARRAY[...]` overlap used by the structured retrieval layer.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "StructuredMemory_tags_gin"
  ON "StructuredMemory" USING GIN (tags);

CREATE INDEX IF NOT EXISTS "StructuredMemory_title_trgm"
  ON "StructuredMemory" USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructuredMemory_summary_trgm"
  ON "StructuredMemory" USING GIN (summary gin_trgm_ops);