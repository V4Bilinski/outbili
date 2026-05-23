-- Story W3-08: pipeline de enriquecimento profundo via Assertiva Localize V3.
-- 3 tabelas no schema app: socios -> vinculos / telefones.
-- LGPD: CPF nunca em texto plano (cifrado via pgsodium + hash sha256 p/ dedupe).

CREATE TABLE IF NOT EXISTS "app"."socios" (
    "id"                              uuid DEFAULT gen_random_uuid() NOT NULL,
    "lead_id"                         uuid NOT NULL,
    "cnpj_origem"                     text NOT NULL,
    "nome"                            text NOT NULL,
    "cpf_cifrado"                     bytea,
    "cpf_hash"                        text,
    "participacao"                    text,
    "cargo"                           text,
    "indice_probabilidade_negociacao" numeric(5,4),
    "protocolo_assertiva"             text,
    "raw"                             jsonb,
    "created_at"                      timestamptz DEFAULT now() NOT NULL,
    "updated_at"                      timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "socios_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "app"."socios" OWNER TO "postgres";
COMMENT ON TABLE "app"."socios" IS 'Socios/decisores identificados pela Assertiva Localize V3 para cada empresa (CNPJ). CPF nunca em texto plano: cifrado via pgsodium (bytea) + hash sha256 para lookup. LGPD: base legal = interesse legitimo (prospecao B2B outbound, art. 10 LGPD). Story W3-08.';
COMMENT ON COLUMN "app"."socios"."cpf_cifrado" IS 'CPF cifrado server-side. Chave no pgsodium/Vault. Acesso plaintext somente via funcao SECURITY DEFINER.';
COMMENT ON COLUMN "app"."socios"."cpf_hash" IS 'SHA-256 com salt do CPF. Permite dedupe e lookup sem decifrar.';
COMMENT ON COLUMN "app"."socios"."indice_probabilidade_negociacao" IS 'Score 0.0-1.0 calculado pela Edge Function (whatsapp pessoal, telefone hot, renda, vinculos, cargo).';

CREATE TABLE IF NOT EXISTS "app"."socio_vinculos" (
    "id"                            uuid DEFAULT gen_random_uuid() NOT NULL,
    "socio_id"                      uuid NOT NULL,
    "tipo"                          text NOT NULL,
    "nome_relacionado"              text,
    "documento_relacionado_cifrado" bytea,
    "documento_hash"                text,
    "grau_parentesco"               text,
    "cnpj_vinculado"                text,
    "razao_social_vinculada"        text,
    "raw"                           jsonb,
    "created_at"                    timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "socio_vinculos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "socio_vinculos_tipo_check" CHECK ("tipo" IN ('familiar', 'societario_cruzado'))
);
ALTER TABLE "app"."socio_vinculos" OWNER TO "postgres";
COMMENT ON TABLE "app"."socio_vinculos" IS 'Vinculos do socio: familiares (conjuge/filhos) e participacoes societarias cruzadas. Fonte: Assertiva /localize-api/v1/base-cadastral/conexoes. Story W3-08.';
COMMENT ON COLUMN "app"."socio_vinculos"."tipo" IS '''familiar'': vinculo por grau de parentesco. ''societario_cruzado'': mesma pessoa socia em outra empresa.';

CREATE TABLE IF NOT EXISTS "app"."socio_telefones" (
    "id"                    uuid DEFAULT gen_random_uuid() NOT NULL,
    "socio_id"              uuid NOT NULL,
    "telefone_e164"         text NOT NULL,
    "whatsapp_pessoal"      boolean DEFAULT false,
    "whatsapp_confirmado"   boolean DEFAULT false,
    "is_hot"                boolean DEFAULT false,
    "origem"                text,
    "ranking"               integer,
    "raw"                   jsonb,
    "created_at"            timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "socio_telefones_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "app"."socio_telefones" OWNER TO "postgres";
COMMENT ON TABLE "app"."socio_telefones" IS 'Telefones por socio/decisor (1:N). Fonte: Assertiva /cpf + /mais-telefones. Pertence ao individuo (CPF), nao a empresa. Story W3-08.';
COMMENT ON COLUMN "app"."socio_telefones"."whatsapp_confirmado" IS 'true quando (hotphone OR plus) E whatsapp_pessoal. Espelha extractBestPhone() em src/services/assertivaService.ts.';

CREATE INDEX IF NOT EXISTS "socios_lead_id_idx" ON "app"."socios" ("lead_id");
CREATE INDEX IF NOT EXISTS "socios_cnpj_origem_idx" ON "app"."socios" ("cnpj_origem");
CREATE INDEX IF NOT EXISTS "socios_cpf_hash_idx" ON "app"."socios" ("cpf_hash") WHERE "cpf_hash" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "socio_vinculos_socio_id_idx" ON "app"."socio_vinculos" ("socio_id");
CREATE INDEX IF NOT EXISTS "socio_vinculos_documento_hash_idx" ON "app"."socio_vinculos" ("documento_hash") WHERE "documento_hash" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "socio_telefones_socio_id_idx" ON "app"."socio_telefones" ("socio_id");
CREATE INDEX IF NOT EXISTS "socio_telefones_e164_idx" ON "app"."socio_telefones" ("telefone_e164");

ALTER TABLE ONLY "app"."socios" ADD CONSTRAINT "socios_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "app"."leads"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "app"."socio_vinculos" ADD CONSTRAINT "socio_vinculos_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "app"."socios"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "app"."socio_telefones" ADD CONSTRAINT "socio_telefones_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "app"."socios"("id") ON DELETE CASCADE;

CREATE TRIGGER "socios_set_updated_at" BEFORE UPDATE ON "app"."socios" FOR EACH ROW EXECUTE FUNCTION "app"."set_updated_at"();

ALTER TABLE "app"."socios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app"."socio_vinculos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app"."socio_telefones" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "socios_authenticated_select" ON "app"."socios" FOR SELECT TO authenticated USING (true);
CREATE POLICY "socios_authenticated_insert" ON "app"."socios" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "socios_authenticated_update" ON "app"."socios" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "socios_service_role_all" ON "app"."socios" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "socio_vinculos_authenticated_select" ON "app"."socio_vinculos" FOR SELECT TO authenticated USING (true);
CREATE POLICY "socio_vinculos_authenticated_insert" ON "app"."socio_vinculos" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "socio_vinculos_service_role_all" ON "app"."socio_vinculos" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "socio_telefones_authenticated_select" ON "app"."socio_telefones" FOR SELECT TO authenticated USING (true);
CREATE POLICY "socio_telefones_authenticated_insert" ON "app"."socio_telefones" FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "socio_telefones_authenticated_update" ON "app"."socio_telefones" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "socio_telefones_service_role_all" ON "app"."socio_telefones" FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON TABLE "app"."socios" TO "postgres";
GRANT SELECT, INSERT, UPDATE ON TABLE "app"."socios" TO "authenticated";
GRANT ALL ON TABLE "app"."socios" TO "service_role";
GRANT ALL ON TABLE "app"."socio_vinculos" TO "postgres";
GRANT SELECT, INSERT ON TABLE "app"."socio_vinculos" TO "authenticated";
GRANT ALL ON TABLE "app"."socio_vinculos" TO "service_role";
GRANT ALL ON TABLE "app"."socio_telefones" TO "postgres";
GRANT SELECT, INSERT, UPDATE ON TABLE "app"."socio_telefones" TO "authenticated";
GRANT ALL ON TABLE "app"."socio_telefones" TO "service_role";
