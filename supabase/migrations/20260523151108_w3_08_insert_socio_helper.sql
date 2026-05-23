-- W3-08: Funções auxiliares para inserção de sócio com cifragem interna de CPF.
-- Evita o round-trip bytea via PostgREST (base64 → reinserção problemática).
-- SECURITY DEFINER garante acesso ao Vault mesmo com service_role.

-- -------------------------------------------------------------------------
-- app.insert_socio: insere um sócio com CPF cifrado internamente.
-- Retorna o UUID do registro criado.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.insert_socio(
  p_lead_id              uuid,
  p_cnpj_origem          text,
  p_nome                 text,
  p_cpf_claro            text,       -- CPF em claro (será cifrado aqui); NULL se ausente
  p_cpf_hash             text,
  p_participacao         text,
  p_cargo                text,
  p_indice_prob          numeric,
  p_protocolo_assertiva  text,
  p_raw                  jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, extensions, public
AS $$
DECLARE
  v_cpf_cifrado bytea;
  v_id          uuid;
BEGIN
  -- Cifra o CPF somente se fornecido
  IF p_cpf_claro IS NOT NULL AND p_cpf_claro <> '' THEN
    v_cpf_cifrado := app.encrypt_cpf(p_cpf_claro);
  END IF;

  INSERT INTO app.socios (
    lead_id,
    cnpj_origem,
    nome,
    cpf_cifrado,
    cpf_hash,
    participacao,
    cargo,
    indice_probabilidade_negociacao,
    protocolo_assertiva,
    raw
  ) VALUES (
    p_lead_id,
    p_cnpj_origem,
    p_nome,
    v_cpf_cifrado,
    p_cpf_hash,
    p_participacao,
    p_cargo,
    p_indice_prob,
    p_protocolo_assertiva,
    p_raw
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- -------------------------------------------------------------------------
-- app.insert_vinculo_familiar: insere vínculo familiar com CPF do familiar
-- cifrado internamente. Recebe CPF em claro.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.insert_vinculo_familiar(
  p_socio_id               uuid,
  p_nome_relacionado       text,
  p_cpf_familiar_claro     text,       -- CPF do familiar em claro; NULL se ausente
  p_documento_hash         text,
  p_grau_parentesco        text,
  p_raw                    jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, extensions, public
AS $$
DECLARE
  v_doc_cifrado bytea;
BEGIN
  IF p_cpf_familiar_claro IS NOT NULL AND p_cpf_familiar_claro <> '' THEN
    v_doc_cifrado := app.encrypt_cpf(p_cpf_familiar_claro);
  END IF;

  INSERT INTO app.socio_vinculos (
    socio_id,
    tipo,
    nome_relacionado,
    documento_relacionado_cifrado,
    documento_hash,
    grau_parentesco,
    cnpj_vinculado,
    razao_social_vinculada,
    raw
  ) VALUES (
    p_socio_id,
    'familiar',
    p_nome_relacionado,
    v_doc_cifrado,
    p_documento_hash,
    p_grau_parentesco,
    NULL,
    NULL,
    p_raw
  );
END;
$$;

-- Permissões para service_role e authenticated
GRANT EXECUTE ON FUNCTION app.insert_socio(uuid, text, text, text, text, text, text, numeric, text, jsonb) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION app.insert_vinculo_familiar(uuid, text, text, text, text, jsonb) TO service_role, authenticated;
