import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase
const SUPABASE_URL = 'https://lselbkpetwshmgchfyyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZWxia3BldHdzaG1nY2hmeXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDA2MjgsImV4cCI6MjA5NDE3NjYyOH0.cTtmd2p_kPo6SYLgj4Y-zKcdr0KDyYvbjGDwK-ieGAs';

// Criar cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tipos para TypeScript
export type Colaborador = {
  matricula: string;
  nome: string | null;
  cargo: string | null;
  departamento: string | null;
  status: string | null;
  data_admissao: string | null;
  email: string | null;
  telefone: string | null;
  created_at: string;
  updated_at: string;
};

export type Falta = {
  id: number;
  matricula: string;
  data: string | null;
  justificativa: string | null;
  cid: string | null;
  horas_perdidas: number | null;
  tipo_afastamento: string | null;
  created_at: string;
  updated_at: string;
};

export type Ferias = {
  id: number;
  matricula: string;
  data_inicio: string | null;
  data_fim: string | null;
  dias_utilizados: number | null;
  dias_restantes: number | null;
  status: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type MedidaDisciplinar = {
  id: number;
  matricula: string;
  tipo_medida: string | null;
  data_aplicacao: string | null;
  motivo: string | null;
  descricao: string | null;
  status: string | null;
  data_encerramento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};
