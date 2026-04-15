# Checklist de Aprovacao de Template

## Pre-Submissao (Antes de Enviar para Meta)

### Categoria e Classificacao
- [ ] Categoria corresponde ao conteudo (MARKETING / UTILITY / AUTHENTICATION)
- [ ] Template MARKETING nao usado para conteudo transacional
- [ ] Template UTILITY nao usado para conteudo promocional
- [ ] Template AUTHENTICATION segue formato padrao da Meta

### Limites de Caracteres
- [ ] Body com no maximo 1024 caracteres
- [ ] Header com no maximo 60 caracteres (se texto)
- [ ] Footer com no maximo 60 caracteres
- [ ] Texto de cada botao com no maximo 25 caracteres
- [ ] Nome do template em snake_case, apenas letras minusculas e underscores

### Variaveis e Exemplos
- [ ] Todas as variaveis possuem valores de exemplo
- [ ] Variaveis numeradas sequencialmente ({{1}}, {{2}}, {{3}})
- [ ] Nenhuma variavel adjacente a pontuacao (sem {{1}}. ou {{1}},)
- [ ] Valores de exemplo nao contem dados sensiveis

---

## Conteudo e Compliance

### Conteudo Proibido
- [ ] Nenhum conteudo das 44+ categorias proibidas pela Meta
- [ ] Sem conteudo relacionado a armas, drogas, tabaco ou alcool
- [ ] Sem conteudo adulto ou sexualmente sugestivo
- [ ] Sem conteudo politico ou relacionado a eleicoes
- [ ] Sem ameacas, assedio ou discurso de odio
- [ ] Sem dados sensiveis (numeros de cartao, CPF, senhas)

### Boas Praticas de Conteudo
- [ ] URLs colocadas em botoes (nao no corpo do texto)
- [ ] Sem URLs encurtadas no corpo da mensagem
- [ ] Idioma declarado correto (pt_BR para portugues brasileiro)
- [ ] Tom adequado ao tipo de mensagem e publico

---

## Midia e Botoes

### Midia (se aplicavel)
- [ ] Imagem: JPEG ou PNG, maximo 5MB
- [ ] Video: MP4, maximo 16MB
- [ ] Documento: PDF, maximo 100MB
- [ ] Midia dentro dos limites de tamanho

### Botoes (se aplicavel)
- [ ] Maximo 10 botoes por template
- [ ] Quick reply: maximo 3 botoes
- [ ] URL botao: URL valida e funcional
- [ ] Phone botao: numero em formato valido
- [ ] Botoes nao duplicados

---

## Marketing Especifico

### Opt-out (obrigatorio para MARKETING)
- [ ] Mecanismo de opt-out presente no template
- [ ] Instrucoes claras de como parar de receber mensagens
- [ ] Opt-out processavel em ate 24 horas

---

## Validacao Final

### Revisao Tecnica
- [ ] JSON do template validado sintaticamente
- [ ] Payload testado em ambiente sandbox (se disponivel)
- [ ] Template nao duplica template existente aprovado
- [ ] Nome do template unico dentro da WABA
