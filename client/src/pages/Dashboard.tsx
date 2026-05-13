import React, { useMemo, useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useColaborador } from '@/contexts/ColaboradorContext';
import { supabase } from '@/lib/supabase';
import { Users, AlertCircle, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, PieChart, 
  Pie, Cell 
} from 'recharts';

interface Ferias {
  id: number;
  matricula: string;
  status: string;
}

interface MedidaDisciplinar {
  id: number;
  matricula: string;
  status: string;
}

export default function Dashboard() {
  const { colaboradores, faltas, loading } = useColaborador();
  const [ferias, setFerias] = useState<Ferias[]>([]);
  const [medidas, setMedidas] = useState<MedidaDisciplinar[]>([]);
  const [afastamentos, setAfastamentos] = useState<any[]>([]);

  // Carregar dados adicionais das tabelas do Supabase
  useEffect(() => {
    loadAdditionalData();
  }, []);

  const loadAdditionalData = async () => {
    try {
      const [feriasRes, medidasRes, afastamentosRes] = await Promise.all([
        supabase.from('ferias').select('*'),
        supabase.from('medidas_disciplinares').select('*'),
        supabase.from('afastamentos').select('*'),
      ]);

      if (feriasRes.data) setFerias(feriasRes.data);
      if (medidasRes.data) setMedidas(medidasRes.data);
      if (afastamentosRes.data) setAfastamentos(afastamentosRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados adicionais:', error);
    }
  };

  // Calcular estatísticas e dados dos gráficos
  const stats = useMemo(() => {
    const totalColaboradores = colaboradores.length;
    const colaboradoresAtivos = colaboradores.filter((c) => c.status === 'Ativo').length;
    const colaboradoresInativos = totalColaboradores - colaboradoresAtivos;
    
    // CORREÇÃO: Agora conta os dados da tabela 'afastamentos' em vez de 'faltas'
    const totalAfastamentos = afastamentos.length; 
    
    const totalFeriasAtivas = ferias.filter((f) => f.status === 'Em Andamento' || f.status === 'Agendada').length;
    const totalMedidasAtivas = medidas.filter((m) => m.status === 'Ativa').length;

    // Lógica para o gráfico de Absenteísmo (baseado em faltas mensais)
    const absenteismoPorMes: Record<string, { mes: string; faltas: number; horas: number }> = {};

    faltas.forEach((falta) => {
      if (falta.data) {
        const data = new Date(falta.data);
        const mesAno = `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;

        if (!absenteismoPorMes[mesAno]) {
          absenteismoPorMes[mesAno] = { mes: mesAno, faltas: 0, horas: 0 };
        }

        absenteismoPorMes[mesAno].faltas += 1;
        absenteismoPorMes[mesAno].horas += falta.horas_perdidas || 0;
      }
    });

    const graficoAbsenteismo = Object.values(absenteismoPorMes)
      .sort((a, b) => {
        const [mesA, anoA] = a.mes.split('/');
        const [mesB, anoB] = b.mes.split('/');
        return new Date(parseInt(anoA), parseInt(mesA) - 1).getTime() - new Date(parseInt(anoB), parseInt(mesB) - 1).getTime();
      })
      .slice(-6); // Mostrar apenas os últimos 6 meses

    // Dados para o gráfico de pizza (Ativos vs Inativos)
    const graficoColaboradores = [
      { name: 'Ativos', value: colaboradoresAtivos, fill: '#10b981' },
      { name: 'Inativos', value: colaboradoresInativos, fill: '#ef4444' },
    ];

    return {
      totalColaboradores,
      colaboradoresAtivos,
      colaboradoresInativos,
      totalAfastamentos,
      totalFeriasAtivas,
      totalMedidasAtivas,
      graficoAbsenteismo,
      graficoColaboradores,
    };
    
    // CORREÇÃO: Adicionado 'afastamentos' como dependência para o Dashboard atualizar sozinho
  }, [colaboradores, faltas, ferias, medidas, afastamentos]);

  if (loading) {
    return (
      <Layout currentPage="dashboard">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500 text-lg">A carregar indicadores...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="dashboard">
      {/* Cards de Indicadores Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Colaboradores</p>
              <h3 className="text-2xl font-bold text-[#2b3674]">{stats.totalColaboradores}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Afastamentos</p>
              <h3 className="text-2xl font-bold text-[#2b3674]">{stats.totalAfastamentos}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-full">
              <AlertCircle className="text-amber-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Férias Ativas/Agendadas</p>
              <h3 className="text-2xl font-bold text-[#2b3674]">{stats.totalFeriasAtivas}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Clock className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Medidas Ativas</p>
              <h3 className="text-2xl font-bold text-[#2b3674]">{stats.totalMedidasAtivas}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <TrendingDown className="text-red-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gráfico de Absenteísmo */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-[#2b3674] mb-6">Tendência de Absenteísmo (Faltas)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.graficoAbsenteismo}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="faltas" name="Total de Faltas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Composição do Efetivo */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-[#2b3674] mb-6">Status do Efetivo</h3>
          <div className="h-80">
            {stats.totalColaboradores > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.graficoColaboradores}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.graficoColaboradores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Sem dados de colaboradores para exibir</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="bg-gradient-to-r from-[#2b3674] to-blue-600 rounded-lg shadow-md p-6 text-white">
        <h3 className="text-lg font-bold mb-4">Resumo Executivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-blue-100 text-sm">Taxa de Afastamento</p>
            <p className="text-2xl font-bold">
              {stats.totalColaboradores > 0
                ? ((stats.totalAfastamentos / stats.totalColaboradores) * 100).toFixed(1)
                : '0.0'}
              %
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Colaboradores Inativos</p>
            <p className="text-2xl font-bold">{stats.colaboradoresInativos}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Medidas Disciplinares</p>
            <p className="text-2xl font-bold">{stats.totalMedidasAtivas}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Efetivo Ativo</p>
            <p className="text-2xl font-bold">{stats.colaboradoresAtivos}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
