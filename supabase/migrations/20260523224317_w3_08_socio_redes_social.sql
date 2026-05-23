-- Camada 2 (Fase 1): redes sociais atribuidas via Apify.
-- socio_id NULL = rede da EMPRESA (lead). socio_id preenchido = rede do socio.
-- Fonte exclusiva de redes sociais (nao toca telefone/WhatsApp).

CREATE TABLE IF NOT EXISTS "app"."socio_redes" (
    "id"             uuid DEFAULT gen_random_uuid() NOT NULL,
    "lead_id"        uuid NOT NULL,
    "socio_id"       uuid,                     -- NULL = rede da empresa
    "plataforma"     text NOT NULL,            -- instagram | linkedin | tiktok | facebook
    "url"            text NOT NULL,
    "handle"         text,
    "nome_exibicao"  text,
    "bio"            text,
    "seguidores"     integer,
    "verificado"     boolean DEFAULT false,
    "contato_externo" text,                    -- linktr.ee / link na bio (insumo p/ fallback WhatsApp)
    "fonte"          text DEFAULT 'apify',
    "confianca"      text,                      -- alta | media | baixa
    "match_motivo"   text,                      -- ex: "endereco confere: Rua Augusta 962"
    "raw"            jsonb,
    "created_at"     timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "socio_redes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "socio_redes_plataforma_check" CHECK ("plataforma" IN ('instagram','linkedin','tiktok','facebook','youtube','twitter')),
    CONSTRAINT "socio_redes_uniq" UNIQUE ("lead_id","plataforma","url")
);
ALTER TABLE "app"."socio_redes" OWNER TO "postgres";

COMMENT ON TABLE "app"."socio_redes" IS
  'Camada 2 (Fase 1): redes sociais atribuidas via Apify. socio_id NULL = rede da empresa; '
  'preenchido = rede do socio. confianca alta quando endereco/cidade confere. Story W3-08 / Camada 2.';

CREATE INDEX IF NOT EXISTS "socio_redes_lead_id_idx"  ON "app"."socio_redes" ("lead_id");
CREATE INDEX IF NOT EXISTS "socio_redes_socio_id_idx" ON "app"."socio_redes" ("socio_id") WHERE "socio_id" IS NOT NULL;

ALTER TABLE ONLY "app"."socio_redes"
    ADD CONSTRAINT "socio_redes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "app"."socio_redes"
    ADD CONSTRAINT "socio_redes_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "app"."socios"("id") ON DELETE CASCADE;

ALTER TABLE "app"."socio_redes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "socio_redes_authenticated_select" ON "app"."socio_redes" FOR SELECT TO authenticated USING (true);
CREATE POLICY "socio_redes_authenticated_insert" ON "app"."socio_redes" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "socio_redes_authenticated_update" ON "app"."socio_redes" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "socio_redes_service_role_all"     ON "app"."socio_redes" FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON TABLE "app"."socio_redes" TO "postgres";
GRANT SELECT, INSERT, UPDATE ON TABLE "app"."socio_redes" TO "authenticated";
GRANT ALL ON TABLE "app"."socio_redes" TO "service_role";
