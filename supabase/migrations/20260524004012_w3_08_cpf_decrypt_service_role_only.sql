-- Governança LGPD (decisão do operador 2026-05-23): minimização de acesso ao CPF.
-- Apenas service_role (Edge Functions) pode cifrar/decifrar CPF. authenticated
-- (usuários logados) NÃO decifra. O frontend não exibe CPF, então não quebra.
-- As funções insert_socio/insert_vinculo_familiar são SECURITY DEFINER (rodam como
-- owner) e continuam cifrando internamente sem depender deste grant.

REVOKE EXECUTE ON FUNCTION app.decrypt_cpf(bytea) FROM authenticated;
REVOKE EXECUTE ON FUNCTION app.encrypt_cpf(text)  FROM authenticated;

COMMENT ON FUNCTION app.decrypt_cpf(bytea) IS
  'W3-08 + LGPD: decifra CPF formatado. EXECUTE restrito a service_role (Edge Functions). '
  'authenticated NAO decifra (minimizacao de acesso a PII).';
