-- ============================================================================
-- SCHEMA: Gestão Administrativa de Retenção
-- Criado para: Supabase PostgreSQL
-- Descrição: Tabelas para gerenciar colaboradores e registros de faltas/afastamentos
-- ============================================================================

-- ============================================================================
-- TABELA: colaboradores
-- Descrição: Registro de todos os colaboradores da organização
-- Chave Primária: matricula (obrigatória, única)
-- Regra: Todos os campos exceto matricula aceitam NULL
-- ============================================================================
CREATE TABLE IF NOT EXISTS colaboradores (
  matricula VARCHAR(50) PRIMARY KEY NOT NULL,
  nome VARCHAR(255),
  cargo VARCHAR(255),
  departamento VARCHAR(255),
  status VARCHAR(50),
  data_admissao DATE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para melhorar buscas por nome
CREATE INDEX IF NOT EXISTS idx_colaboradores_nome ON colaboradores(nome);
CREATE INDEX IF NOT EXISTS idx_colaboradores_status ON colaboradores(status);

-- ============================================================================
-- TABELA: faltas
-- Descrição: Registro de faltas, justificativas e afastamentos
-- Chave Primária: id (auto-incremento)
-- Chave Estrangeira: matricula (referencia colaboradores)
-- Regra: Todos os campos exceto id e matricula aceitam NULL
-- ============================================================================
CREATE TABLE IF NOT EXISTS faltas (
  id BIGSERIAL PRIMARY KEY,
  matricula VARCHAR(50) NOT NULL,
  data DATE,
  justificativa VARCHAR(500),
  cid VARCHAR(20),
  horas_perdidas NUMERIC(5, 2),
  tipo_afastamento VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_faltas_colaboradores FOREIGN KEY (matricula) REFERENCES colaboradores(matricula) ON DELETE CASCADE
);

-- Criar índices para melhorar buscas
CREATE INDEX IF NOT EXISTS idx_faltas_matricula ON faltas(matricula);
CREATE INDEX IF NOT EXISTS idx_faltas_data ON faltas(data);
CREATE INDEX IF NOT EXISTS idx_faltas_cid ON faltas(cid);

-- ============================================================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- Descrição: Trigger para atualizar o campo updated_at quando um registro é modificado
-- ============================================================================
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela colaboradores
DROP TRIGGER IF EXISTS trigger_atualizar_colaboradores ON colaboradores;
CREATE TRIGGER trigger_atualizar_colaboradores
BEFORE UPDATE ON colaboradores
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at();

-- Aplicar trigger na tabela faltas
DROP TRIGGER IF EXISTS trigger_atualizar_faltas ON faltas;
CREATE TRIGGER trigger_atualizar_faltas
BEFORE UPDATE ON faltas
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at();

-- ============================================================================
-- POLÍTICAS DE SEGURANÇA (Row Level Security - RLS)
-- Nota: Ajuste conforme sua estratégia de autenticação
-- ============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE faltas ENABLE ROW LEVEL SECURITY;

-- Política permissiva para leitura (ajuste conforme necessário)
CREATE POLICY "Permitir leitura de colaboradores" ON colaboradores
  FOR SELECT USING (true);

CREATE POLICY "Permitir leitura de faltas" ON faltas
  FOR SELECT USING (true);

-- Política permissiva para inserção (ajuste conforme necessário)
CREATE POLICY "Permitir inserção de colaboradores" ON colaboradores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir inserção de faltas" ON faltas
  FOR INSERT WITH CHECK (true);

-- Política permissiva para atualização (ajuste conforme necessário)
CREATE POLICY "Permitir atualização de colaboradores" ON colaboradores
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permitir atualização de faltas" ON faltas
  FOR UPDATE USING (true) WITH CHECK (true);

-- Política permissiva para exclusão (ajuste conforme necessário)
CREATE POLICY "Permitir exclusão de colaboradores" ON colaboradores
  FOR DELETE USING (true);

CREATE POLICY "Permitir exclusão de faltas" ON faltas
  FOR DELETE USING (true);

-- ============================================================================
-- DADOS DE EXEMPLO (opcional - remova em produção)
-- ============================================================================

-- Inserir alguns colaboradores de exemplo
INSERT INTO colaboradores (matricula, nome, cargo, departamento, status, data_admissao, email)
VALUES
  ('MAT001', 'João Silva', 'Analista de Sistemas', 'TI', 'Ativo', '2020-01-15', 'joao@example.com'),
  ('MAT002', 'Maria Santos', 'Gerente de Projetos', 'Projetos', 'Ativo', '2019-06-20', 'maria@example.com'),
  ('MAT003', 'Pedro Oliveira', 'Desenvolvedor', 'TI', 'Ativo', '2021-03-10', 'pedro@example.com')
ON CONFLICT (matricula) DO NOTHING;

-- Inserir alguns registros de faltas de exemplo
INSERT INTO faltas (matricula, data, justificativa, cid, horas_perdidas, tipo_afastamento)
VALUES
  ('MAT001', '2024-05-10', 'Doença', 'J00', 8.0, 'Falta Justificada'),
  ('MAT002', '2024-05-11', NULL, NULL, 4.0, 'Falta Injustificada'),
  ('MAT001', '2024-05-12', 'Consulta Médica', 'Z12.4', 2.0, 'Falta Justificada')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================


-- ============================================================================
-- TABELA: ferias
-- Descrição: Registro de períodos de férias dos colaboradores
-- Chave Primária: id (auto-incremento)
-- Chave Estrangeira: matricula (referencia colaboradores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ferias (
  id BIGSERIAL PRIMARY KEY,
  matricula VARCHAR(50) NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  dias_utilizados INTEGER,
  dias_restantes INTEGER,
  status VARCHAR(50),
  observacoes VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ferias_colaboradores FOREIGN KEY (matricula) REFERENCES colaboradores(matricula) ON DELETE CASCADE
);

-- Criar índices para melhorar buscas
CREATE INDEX IF NOT EXISTS idx_ferias_matricula ON ferias(matricula);
CREATE INDEX IF NOT EXISTS idx_ferias_data_inicio ON ferias(data_inicio);
CREATE INDEX IF NOT EXISTS idx_ferias_status ON ferias(status);

-- ============================================================================
-- TABELA: medidas_disciplinares
-- Descrição: Registro de medidas disciplinares aplicadas aos colaboradores
-- Chave Primária: id (auto-incremento)
-- Chave Estrangeira: matricula (referencia colaboradores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS medidas_disciplinares (
  id BIGSERIAL PRIMARY KEY,
  matricula VARCHAR(50) NOT NULL,
  tipo_medida VARCHAR(100),
  data_aplicacao DATE,
  motivo VARCHAR(500),
  descricao VARCHAR(1000),
  status VARCHAR(50),
  data_encerramento DATE,
  observacoes VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_medidas_colaboradores FOREIGN KEY (matricula) REFERENCES colaboradores(matricula) ON DELETE CASCADE
);

-- Criar índices para melhorar buscas
CREATE INDEX IF NOT EXISTS idx_medidas_matricula ON medidas_disciplinares(matricula);
CREATE INDEX IF NOT EXISTS idx_medidas_data_aplicacao ON medidas_disciplinares(data_aplicacao);
CREATE INDEX IF NOT EXISTS idx_medidas_tipo ON medidas_disciplinares(tipo_medida);
CREATE INDEX IF NOT EXISTS idx_medidas_status ON medidas_disciplinares(status);

-- Aplicar trigger na tabela ferias
DROP TRIGGER IF EXISTS trigger_atualizar_ferias ON ferias;
CREATE TRIGGER trigger_atualizar_ferias
BEFORE UPDATE ON ferias
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at();

-- Aplicar trigger na tabela medidas_disciplinares
DROP TRIGGER IF EXISTS trigger_atualizar_medidas ON medidas_disciplinares;
CREATE TRIGGER trigger_atualizar_medidas
BEFORE UPDATE ON medidas_disciplinares
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at();

-- ============================================================================
-- POLÍTICAS DE SEGURANÇA (Row Level Security - RLS)
-- ============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE ferias ENABLE ROW LEVEL SECURITY;
ALTER TABLE medidas_disciplinares ENABLE ROW LEVEL SECURITY;

-- Políticas para ferias
CREATE POLICY "Permitir leitura de ferias" ON ferias
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de ferias" ON ferias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de ferias" ON ferias
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão de ferias" ON ferias
  FOR DELETE USING (true);

-- Políticas para medidas_disciplinares
CREATE POLICY "Permitir leitura de medidas" ON medidas_disciplinares
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de medidas" ON medidas_disciplinares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de medidas" ON medidas_disciplinares
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Permitir exclusão de medidas" ON medidas_disciplinares
  FOR DELETE USING (true);

-- ============================================================================
-- DADOS DE EXEMPLO (opcional - remova em produção)
-- ============================================================================

-- Inserir alguns registros de férias de exemplo
INSERT INTO ferias (matricula, data_inicio, data_fim, dias_utilizados, dias_restantes, status, observacoes)
VALUES
  ('MAT001', '2024-06-01', '2024-06-15', 15, 15, 'Concluída', 'Férias de junho'),
  ('MAT002', '2024-07-01', '2024-07-30', 30, 0, 'Concluída', 'Férias de julho'),
  ('MAT003', '2024-08-15', '2024-08-29', 15, 15, 'Agendada', 'Férias agendadas')
ON CONFLICT DO NOTHING;

-- Inserir alguns registros de medidas disciplinares de exemplo
INSERT INTO medidas_disciplinares (matricula, tipo_medida, data_aplicacao, motivo, descricao, status)
VALUES
  ('MAT001', 'Advertência', '2024-05-10', 'Atraso recorrente', 'Primeira advertência por atrasos', 'Ativa'),
  ('MAT002', 'Suspensão', '2024-04-15', 'Comportamento inadequado', 'Suspensão de 3 dias', 'Encerrada'),
  ('MAT003', 'Repreensão', '2024-05-05', 'Não cumprimento de normas', 'Repreensão verbal registrada', 'Ativa')
ON CONFLICT DO NOTHING;
