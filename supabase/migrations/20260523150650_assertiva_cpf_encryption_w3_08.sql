-- Story W3-08: cifragem reversivel de CPF dos socios.
-- Chave mestra no Vault + pgp_sym (pgcrypto). CPF recuperavel/exibivel formatado.
-- Acesso plaintext somente via funcoes SECURITY DEFINER (owner postgres).

-- 1. Chave mestra no Vault (idempotente)
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'outbili_cpf_master_key') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'outbili_cpf_master_key',
      'W3-08: chave simetrica de cifragem de CPF dos socios (pgp_sym). LGPD art.10.'
    );
  end if;
end $$;

-- 2. Cifrar CPF (normaliza para digitos antes de cifrar)
create or replace function app.encrypt_cpf(p_cpf text)
returns bytea
language plpgsql
security definer
set search_path = ''
as $$
declare v_key text; v_digits text;
begin
  if p_cpf is null then return null; end if;
  v_digits := regexp_replace(p_cpf, '\D', '', 'g');
  if v_digits = '' then return null; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'outbili_cpf_master_key' limit 1;
  if v_key is null then raise exception 'Chave de cifragem CPF ausente no Vault'; end if;
  return extensions.pgp_sym_encrypt(v_digits, v_key);
end;
$$;

-- 3. Decifrar CPF e formatar 000.000.000-00
create or replace function app.decrypt_cpf(p_enc bytea)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_key text; v_raw text;
begin
  if p_enc is null then return null; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'outbili_cpf_master_key' limit 1;
  if v_key is null then raise exception 'Chave de cifragem CPF ausente no Vault'; end if;
  v_raw := extensions.pgp_sym_decrypt(p_enc, v_key);
  if length(v_raw) = 11 then
    return substr(v_raw,1,3) || '.' || substr(v_raw,4,3) || '.' || substr(v_raw,7,3) || '-' || substr(v_raw,10,2);
  end if;
  return v_raw;
end;
$$;

revoke all on function app.encrypt_cpf(text) from public;
revoke all on function app.decrypt_cpf(bytea) from public;
grant execute on function app.encrypt_cpf(text) to service_role, authenticated;
grant execute on function app.decrypt_cpf(bytea) to service_role, authenticated;

comment on function app.encrypt_cpf(text) is 'W3-08: cifra CPF (normaliza p/ digitos) via pgp_sym com chave do Vault. SECURITY DEFINER.';
comment on function app.decrypt_cpf(bytea) is 'W3-08: decifra CPF e retorna formatado 000.000.000-00. SECURITY DEFINER. Acesso governado pela RLS das tabelas que armazenam o ciphertext.';
