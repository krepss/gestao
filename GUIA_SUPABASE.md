# Guia Completo: Configurar Supabase e Conectar ao Projeto

Este guia te ajudará a configurar o banco de dados Supabase e conectar ao projeto React.

## 🔧 Passo 1: Acessar o Supabase

1. Acesse: https://app.supabase.com
2. Faça login com sua conta (ou crie uma se não tiver)
3. Você verá a lista de projetos

## 📊 Passo 2: Criar ou Acessar um Projeto

### Opção A: Usar um projeto existente
1. Clique no projeto que deseja usar
2. Vá para a seção **SQL Editor** (no menu esquerdo)

### Opção B: Criar um novo projeto
1. Clique em "New Project"
2. Preencha os dados:
   - **Name**: `gestao-retencao` (ou outro nome)
   - **Database Password**: Crie uma senha forte
   - **Region**: Selecione a região mais próxima (ex: South America - São Paulo)
3. Clique em "Create new project"
4. Aguarde a criação (pode levar alguns minutos)
5. Quando terminar, vá para **SQL Editor**

## 🗄️ Passo 3: Executar o Script SQL

1. No painel do Supabase, clique em **SQL Editor** (menu esquerdo)
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `database-schema.sql` do projeto
4. Cole no editor SQL do Supabase
5. Clique em **Run** (botão azul no canto superior direito)
6. Aguarde a execução (você verá mensagens de sucesso)

## 🔑 Passo 4: Obter as Credenciais do Supabase

1. No painel do Supabase, clique em **Settings** (ícone de engrenagem, menu esquerdo)
2. Clique em **API** (submenu)
3. Você verá:
   - **Project URL**: Copie este valor
   - **Project API keys**: Clique em **Anon public** e copie a chave

## 📝 Passo 5: Atualizar as Credenciais no Projeto

1. Abra o arquivo: `client/src/lib/supabase.ts`
2. Procure por estas linhas:
   ```typescript
   const SUPABASE_URL = 'https://lselbkpetwshmgchfyyj.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```
3. Substitua pelos valores que você copiou:
   - `SUPABASE_URL`: Cole a **Project URL**
   - `SUPABASE_ANON_KEY`: Cole a **Anon public key**

## ✅ Passo 6: Testar a Conexão

1. Inicie o servidor de desenvolvimento:
   ```bash
   pnpm dev
   ```
2. Abra http://localhost:3000 no navegador
3. Vá para a aba **Efetivo**
4. Clique em **Novo** e tente adicionar um colaborador
5. Se funcionar, a conexão está OK!

## 🚀 Passo 7: Importar Dados de Exemplo (Opcional)

1. Acesse a aba **Efetivo**
2. Clique em **Importar**
3. Selecione o arquivo `exemplo-colaboradores.csv` do projeto
4. Os dados serão importados automaticamente

## 📋 Verificar se Tudo Está Funcionando

### Dashboard
- Deve mostrar o número de colaboradores e afastamentos
- O gráfico deve aparecer quando houver dados

### Efetivo
- Deve listar os colaboradores importados
- Você deve conseguir criar, editar e deletar colaboradores

### Férias
- Deve listar as férias (se houver dados de exemplo)
- Você deve conseguir criar, editar e deletar férias

### Medidas Disciplinares
- Deve listar as medidas (se houver dados de exemplo)
- Você deve conseguir criar, editar e deletar medidas

## 🔒 Segurança - Row Level Security (RLS)

O script SQL já configura políticas básicas de RLS. Para produção, você pode:

1. No Supabase, vá para **Authentication** → **Policies**
2. Customize as políticas conforme sua necessidade
3. Restrinja o acesso apenas para usuários autenticados (opcional)

## 🐛 Troubleshooting

### Erro: "Não consigo conectar ao Supabase"
- Verifique se a URL e a chave estão corretas em `client/src/lib/supabase.ts`
- Certifique-se de que o projeto Supabase está ativo
- Verifique se as tabelas foram criadas (vá em **Table Editor** no Supabase)

### Erro: "Tabelas não encontradas"
- Execute novamente o script `database-schema.sql`
- Verifique se não houve erros durante a execução

### Erro: "Permissão negada"
- Verifique as políticas de RLS nas tabelas
- No Supabase, vá em **Table Editor** → Selecione a tabela → **RLS** → Verifique as políticas

### Dados não aparecem na tabela
- Verifique o console do navegador (F12) para erros
- Verifique se os dados foram realmente inseridos (vá em **Table Editor** no Supabase)

## 📞 Suporte

Para mais informações:
- [Documentação do Supabase](https://supabase.com/docs)
- [Supabase Community](https://discord.supabase.io)

---

**Pronto! Agora seu sistema está conectado ao Supabase e pronto para usar!** 🎉
