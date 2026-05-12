# Gestão Administrativa de Retenção

Sistema web moderno para gerenciar colaboradores, registros de faltas e análise de absenteísmo. Desenvolvido com React, Vite, Tailwind CSS e integração direta com Supabase.

## 🎯 Funcionalidades

- **Dashboard**: Visualização de estatísticas gerais (total de colaboradores, afastamentos e taxa de absenteísmo)
- **Gráfico de Absenteísmo**: Análise mensal de faltas com gráficos interativos
- **Gestão de Efetivo**: Tabela elegante com pesquisa em tempo real e CRUD completo
- **Importação de CSV**: Importar colaboradores em lote com conversão automática de datas
- **Gestão de Férias**: CRUD completo para controlar períodos de férias dos colaboradores
- **Medidas Disciplinares**: CRUD completo para registrar e acompanhar medidas disciplinares
- **Interface Responsiva**: Design moderno com sidebar retrátil

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + Vite
- **Estilo**: Tailwind CSS 4
- **Banco de Dados**: Supabase (PostgreSQL)
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Notificações**: Sonner
- **Roteamento**: Wouter

## 📋 Pré-requisitos

- Node.js 18+
- pnpm (ou npm/yarn)
- Conta no Supabase

## 🚀 Instalação Local

1. **Clone o repositório** (ou extraia os arquivos)
   ```bash
   cd gestao-retencao
   ```

2. **Instale as dependências**
   ```bash
   pnpm install
   ```

3. **Configure o Supabase**
   - Acesse https://app.supabase.com
   - Crie um novo projeto ou use um existente
   - Abra o SQL Editor
   - Cole o conteúdo do arquivo `database-schema.sql`
   - Clique em "Run" para criar as tabelas

4. **Inicie o servidor de desenvolvimento**
   ```bash
   pnpm dev
   ```

5. **Acesse a aplicação**
   - Abra http://localhost:3000 no navegador

## 📁 Estrutura do Projeto

```
gestao-retencao/
├── client/
│   ├── public/              # Arquivos estáticos (favicon, etc)
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   │   └── Layout.tsx   # Layout principal com sidebar
│   │   ├── contexts/        # Context API
│   │   │   └── ColaboradorContext.tsx
│   │   ├── lib/
│   │   │   └── supabase.ts  # Configuração do Supabase
│   │   ├── pages/           # Páginas da aplicação
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Efetivo.tsx
│   │   │   ├── Ferias.tsx
│   │   │   └── Medidas.tsx
│   │   ├── App.tsx          # Roteamento principal
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Estilos globais
│   └── index.html
├── database-schema.sql      # Scripts SQL para criar tabelas
├── vercel.json              # Configuração do Vercel
├── .vercelignore            # Arquivos a ignorar no deploy
├── package.json
└── vite.config.ts
```

## 📊 Importação de CSV

### Formato Esperado

O arquivo CSV deve conter as seguintes colunas (na primeira linha):

```
matricula,nome,cargo,departamento,status,data_admissao,email,telefone
```

### Exemplo de Dados

```csv
matricula,nome,cargo,departamento,status,data_admissao,email,telefone
MAT001,João Silva,Analista de Sistemas,TI,Ativo,15/01/2020,joao@example.com,11999999999
MAT002,Maria Santos,Gerente de Projetos,Projetos,Ativo,20/06/2019,maria@example.com,11988888888
MAT003,Pedro Oliveira,Desenvolvedor,TI,Ativo,10/03/2021,pedro@example.com,11977777777
```

### Regras Importantes

- **Matrícula**: Campo obrigatório (chave primária)
- **Datas**: Devem estar no formato **DD/MM/AAAA** (ex: 15/01/2020)
- **Campos Vazios**: Serão convertidos para NULL no banco de dados
- **Conversão Automática**: As datas são convertidas automaticamente para o formato ISO (YYYY-MM-DD) do PostgreSQL

## 📝 Módulos do Sistema

### Dashboard
Visualiza estatísticas gerais em tempo real com cards informativos e gráfico de absenteísmo mensal. Permite acompanhamento rápido da situação de colaboradores e afastamentos.

### Efetivo
Gerencia a lista de colaboradores com funcionalidades de:
- Pesquisa em tempo real
- Importação de CSV com conversão automática de datas
- Edição e exclusão de registros
- Status visual (Ativo/Inativo)

### Férias
Controla períodos de férias com CRUD completo:
- Adicionar novo período de férias
- Editar informações (datas, dias utilizados, status)
- Deletar registros
- Pesquisa por colaborador
- Status: Agendada, Em Andamento, Concluída

### Medidas Disciplinares
Registra e acompanha medidas disciplinares com CRUD completo:
- Adicionar nova medida (Advertência, Repreensão, Suspensão, Demissão)
- Editar informações (motivo, descrição, status)
- Deletar registros
- Pesquisa por colaborador ou tipo de medida
- Status: Ativa, Encerrada

## 🔐 Credenciais do Supabase

As credenciais estão configuradas no arquivo `client/src/lib/supabase.ts`. Para alterar:

1. Abra `client/src/lib/supabase.ts`
2. Atualize `SUPABASE_URL` e `SUPABASE_ANON_KEY`
3. Você pode encontrar essas informações em: Supabase Dashboard → Settings → API

## 🌐 Deploy no Vercel

### Opção 1: Deploy Automático via Git

1. **Faça push do código para GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/seu-usuario/gestao-retencao.git
   git push -u origin main
   ```

2. **Conecte ao Vercel**
   - Acesse https://vercel.com
   - Clique em "New Project"
   - Selecione o repositório `gestao-retencao`
   - Vercel detectará automaticamente a configuração do Vite
   - Clique em "Deploy"

### Opção 2: Deploy Manual via CLI

1. **Instale o Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Faça o deploy**
   ```bash
   vercel
   ```

3. **Siga as instruções interativas**

### Configuração de Variáveis de Ambiente

No painel do Vercel, adicione as variáveis de ambiente:

- `VITE_SUPABASE_URL`: `https://lselbkpetwshmgchfyyj.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: Sua chave anônima do Supabase

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento

# Build
pnpm build            # Compila para produção

# Preview
pnpm preview          # Visualiza build de produção localmente

# Verificação
pnpm check            # Verifica tipos TypeScript
pnpm format           # Formata código com Prettier
```

## 📝 Notas Importantes

### Segurança

- As credenciais do Supabase estão expostas no código (chave anônima). Isso é normal para aplicações frontend.
- Para produção, considere implementar Row Level Security (RLS) no Supabase para restringir acesso aos dados.
- Nunca exponha a chave de serviço (service key) no frontend.

### Performance

- A aplicação carrega dados ao montar. Para grandes volumes, considere implementar paginação.
- Os gráficos usam Recharts, que é otimizado para performance.

### Compatibilidade

- Suporta navegadores modernos (Chrome, Firefox, Safari, Edge)
- Responsivo para desktop, tablet e mobile

## 🐛 Troubleshooting

### Erro: "Não consigo conectar ao Supabase"
- Verifique se a URL e a chave anônima estão corretas em `client/src/lib/supabase.ts`
- Certifique-se de que o projeto Supabase está ativo
- Verifique as políticas de RLS nas tabelas

### Erro: "Tabelas não encontradas"
- Execute o script `database-schema.sql` no SQL Editor do Supabase
- Verifique se as tabelas foram criadas corretamente

### Erro: "Importação de CSV falha"
- Verifique o formato do arquivo (deve ser CSV com separador por vírgula)
- Certifique-se de que as datas estão no formato DD/MM/AAAA
- Verifique se a coluna "matricula" existe e tem valores únicos

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do React](https://react.dev)
- [Documentação do Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação do Vercel](https://vercel.com/docs)

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ usando React, Vite e Supabase**
