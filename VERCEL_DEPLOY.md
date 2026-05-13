# 🚀 Guia de Deploy no Vercel

## Passo 1: Conectar GitHub ao Vercel

1. Acesse https://vercel.com
2. Clique em **"New Project"**
3. Selecione **"Import Git Repository"**
4. Conecte sua conta GitHub
5. Selecione o repositório `gestao-retencao`

## Passo 2: Configurar o Projeto

Na tela de configuração do Vercel, você verá:

```
Application Preset: Vite ✓
Root Directory: ./ ✓
```

Deixe como está (já está correto).

## Passo 3: Preencher as Variáveis de Ambiente ⭐ IMPORTANTE

Você verá uma seção chamada **"Environment Variables"**. Aqui você precisa adicionar as credenciais do Supabase:

### Remover o Exemplo
1. Clique no **ícone de lixeira** ao lado de `EXAMPLE_NAME`

### Adicionar Variável 1: VITE_SUPABASE_URL

1. Clique em **"Add More"**
2. Preencha:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Cole aqui a **Project URL** do Supabase
     - Exemplo: `https://lselbkpetwshmgchfyyj.supabase.co`

### Adicionar Variável 2: VITE_SUPABASE_ANON_KEY

1. Clique em **"Add More"** novamente
2. Preencha:
   - **Key**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Cole aqui a **Anon public key** do Supabase
     - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...`

## Passo 4: Obter as Credenciais do Supabase

Se você não tem as credenciais, siga estes passos:

1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Clique em **Settings** (engrenagem no menu esquerdo)
4. Clique em **API**
5. Você verá:
   - **Project URL** → Copie e cole em `VITE_SUPABASE_URL`
   - **Project API keys** → Clique em **Anon public** → Copie e cole em `VITE_SUPABASE_ANON_KEY`

## Passo 5: Deploy

1. Clique em **"Deploy"** (botão preto na parte inferior)
2. Aguarde o deploy terminar (pode levar 2-3 minutos)
3. Você verá uma mensagem de sucesso com a URL do seu site

## ✅ Verificar se Funcionou

1. Acesse a URL fornecida pelo Vercel
2. Vá para a aba **Efetivo**
3. Clique em **"Novo"** e tente adicionar um colaborador
4. Se funcionar, tudo está OK!

## 🔒 Segurança

- **NUNCA** compartilhe suas credenciais do Supabase
- As variáveis de ambiente do Vercel são privadas e seguras
- Você pode visualizar/editar as variáveis depois no painel do Vercel em **Settings** → **Environment Variables**

## 🐛 Troubleshooting

### Deploy falhou?
- Verifique se as variáveis de ambiente estão preenchidas corretamente
- Verifique se o repositório GitHub está sincronizado

### Erro "Tabelas não encontradas"?
- Execute o script `database-schema.sql` no Supabase antes de fazer o deploy
- Verifique se as credenciais estão corretas

### Dados não aparecem?
- Verifique o console do navegador (F12) para erros
- Verifique se os dados foram inseridos no Supabase (vá em **Table Editor**)

---

**Pronto! Seu sistema estará online em poucos minutos!** 🎉
