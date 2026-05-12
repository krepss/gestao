import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Colaborador, Falta, Ferias, MedidaDisciplinar } from '@/lib/supabase';

interface ColaboradorContextType {
  colaboradores: Colaborador[];
  faltas: Falta[];
  ferias: Ferias[];
  medidas: MedidaDisciplinar[];
  loading: boolean;
  error: string | null;
  fetchColaboradores: () => Promise<void>;
  fetchFaltas: () => Promise<void>;
  fetchFerias: () => Promise<void>;
  fetchMedidas: () => Promise<void>;
  addColaborador: (colaborador: Omit<Colaborador, 'created_at' | 'updated_at'>) => Promise<void>;
  addFalta: (falta: Omit<Falta, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addFerias: (ferias: Omit<Ferias, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addMedida: (medida: Omit<MedidaDisciplinar, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteColaborador: (matricula: string) => Promise<void>;
  deleteFalta: (id: number) => Promise<void>;
  deleteFerias: (id: number) => Promise<void>;
  deleteMedida: (id: number) => Promise<void>;
  updateColaborador: (matricula: string, data: Partial<Colaborador>) => Promise<void>;
  updateFerias: (id: number, data: Partial<Ferias>) => Promise<void>;
  updateMedida: (id: number, data: Partial<MedidaDisciplinar>) => Promise<void>;
}

const ColaboradorContext = createContext<ColaboradorContextType | undefined>(undefined);

export const ColaboradorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [faltas, setFaltas] = useState<Falta[]>([]);
  const [ferias, setFerias] = useState<Ferias[]>([]);
  const [medidas, setMedidas] = useState<MedidaDisciplinar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchColaboradores = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('colaboradores')
        .select('*')
        .order('matricula', { ascending: true });

      if (err) throw err;
      setColaboradores(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar colaboradores';
      setError(message);
      console.error('Erro ao buscar colaboradores:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaltas = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('faltas')
        .select('*')
        .order('data', { ascending: false });

      if (err) throw err;
      setFaltas(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar faltas';
      setError(message);
      console.error('Erro ao buscar faltas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFerias = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('ferias')
        .select('*')
        .order('data_inicio', { ascending: false });

      if (err) throw err;
      setFerias(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar férias';
      setError(message);
      console.error('Erro ao buscar férias:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedidas = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('medidas_disciplinares')
        .select('*')
        .order('data_aplicacao', { ascending: false });

      if (err) throw err;
      setMedidas(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar medidas';
      setError(message);
      console.error('Erro ao buscar medidas:', err);
    } finally {
      setLoading(false);
    }
  };

  const addColaborador = async (colaborador: Omit<Colaborador, 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('colaboradores')
        .insert([colaborador]);

      if (err) throw err;
      await fetchColaboradores();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar colaborador';
      setError(message);
      console.error('Erro ao adicionar colaborador:', err);
      throw err;
    }
  };

  const addFalta = async (falta: Omit<Falta, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('faltas')
        .insert([falta]);

      if (err) throw err;
      await fetchFaltas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar falta';
      setError(message);
      console.error('Erro ao adicionar falta:', err);
      throw err;
    }
  };

  const addFerias = async (ferias: Omit<Ferias, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('ferias')
        .insert([ferias]);

      if (err) throw err;
      await fetchFerias();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar férias';
      setError(message);
      console.error('Erro ao adicionar férias:', err);
      throw err;
    }
  };

  const addMedida = async (medida: Omit<MedidaDisciplinar, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('medidas_disciplinares')
        .insert([medida]);

      if (err) throw err;
      await fetchMedidas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar medida';
      setError(message);
      console.error('Erro ao adicionar medida:', err);
      throw err;
    }
  };

  const deleteColaborador = async (matricula: string) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('colaboradores')
        .delete()
        .eq('matricula', matricula);

      if (err) throw err;
      await fetchColaboradores();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar colaborador';
      setError(message);
      console.error('Erro ao deletar colaborador:', err);
      throw err;
    }
  };

  const deleteFalta = async (id: number) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('faltas')
        .delete()
        .eq('id', id);

      if (err) throw err;
      await fetchFaltas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar falta';
      setError(message);
      console.error('Erro ao deletar falta:', err);
      throw err;
    }
  };

  const deleteFerias = async (id: number) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('ferias')
        .delete()
        .eq('id', id);

      if (err) throw err;
      await fetchFerias();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar férias';
      setError(message);
      console.error('Erro ao deletar férias:', err);
      throw err;
    }
  };

  const deleteMedida = async (id: number) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('medidas_disciplinares')
        .delete()
        .eq('id', id);

      if (err) throw err;
      await fetchMedidas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar medida';
      setError(message);
      console.error('Erro ao deletar medida:', err);
      throw err;
    }
  };

  const updateColaborador = async (matricula: string, data: Partial<Colaborador>) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('colaboradores')
        .update(data)
        .eq('matricula', matricula);

      if (err) throw err;
      await fetchColaboradores();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar colaborador';
      setError(message);
      console.error('Erro ao atualizar colaborador:', err);
      throw err;
    }
  };

  const updateFerias = async (id: number, data: Partial<Ferias>) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('ferias')
        .update(data)
        .eq('id', id);

      if (err) throw err;
      await fetchFerias();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar férias';
      setError(message);
      console.error('Erro ao atualizar férias:', err);
      throw err;
    }
  };

  const updateMedida = async (id: number, data: Partial<MedidaDisciplinar>) => {
    try {
      setError(null);
      const { error: err } = await supabase
        .from('medidas_disciplinares')
        .update(data)
        .eq('id', id);

      if (err) throw err;
      await fetchMedidas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar medida';
      setError(message);
      console.error('Erro ao atualizar medida:', err);
      throw err;
    }
  };

  // Carregar dados ao montar
  useEffect(() => {
    fetchColaboradores();
    fetchFaltas();
    fetchFerias();
    fetchMedidas();
  }, []);

  return (
    <ColaboradorContext.Provider
      value={{
        colaboradores,
        faltas,
        ferias,
        medidas,
        loading,
        error,
        fetchColaboradores,
        fetchFaltas,
        fetchFerias,
        fetchMedidas,
        addColaborador,
        addFalta,
        addFerias,
        addMedida,
        deleteColaborador,
        deleteFalta,
        deleteFerias,
        deleteMedida,
        updateColaborador,
        updateFerias,
        updateMedida,
      }}
    >
      {children}
    </ColaboradorContext.Provider>
  );
};

export const useColaborador = () => {
  const context = useContext(ColaboradorContext);
  if (!context) {
    throw new Error('useColaborador deve ser usado dentro de ColaboradorProvider');
  }
  return context;
};
