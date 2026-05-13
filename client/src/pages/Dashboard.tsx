import React, { useMemo, useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useColaborador } from '@/contexts/ColaboradorContext';
import { supabase } from '@/lib/supabase';
import { Users, AlertCircle, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

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

  // Carregar dados adicionais
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
    } catch (err) {
      console.error('Erro ao carregar dados adicionais:', err);
    }
  };

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalColaboradores = colaboradores.length;
    const colaboradoresAtivos = colaboradores.filter((c) => c.status === 'Ativo').length;
    const colaboradoresInativos = totalColaboradores - colaboradoresAtivos;
    const totalAfastamentos = faltas.length;
    const totalFeriasAtivas = ferias.filter((f) => f.status === 'Em Andamento' || f.status === 'Agendada').length;
    const totalMedidasAtivas = medidas.filter((m) => m.status === 'Ativa').length;

    // Calcular taxa de absenteísmo por mês
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
      .slice(-6); // Últimos 6 meses

    // Dados para gráfico de pizza (Ativos vs Inativos)
    const graficoColaradores = [
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
      graficoColaradores,
    };
  }, [colaboradores, faltas, ferias, medidas]);

  if (loading) {
    return (
      <Layout currentPage="dashboard">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="dashboard">
      {/* Cards de Estatísticas - Primeira Linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card: Total de Colaboradores */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Colaboradores</p>
              <p className="text-3xl font-bold text-[#2b3674] mt-2">{stats.totalColaboradores}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <Users size={28} className="text-blue-500" />
            </div>
          </div>
        </div>

        {/* Card: Colaboradores Ativos */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Colaboradores Ativos</p>
              <p className="text-3xl font-bold text-[#2b3674] mt-2">{stats.colaboradoresAtivos}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <CheckCircle size={28} className="text-green-500" />
            </div>
          </div>
        </div>

        {/* Card: Total de Afastamentos */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Afastamentos</p>
              <p className="text-3xl font-bold text-[#2b3674] mt-2">{stats.totalAfastamentos}</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-lg">
              <AlertCircle size={28} className="text-orange-500" />
            </div>
          </div>
        </div>

        {/* Card: Medidas Ativas */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Medidas Disciplinares Ativas</p>
              <p className="text-3xl font-bold text-[#2b3674] mt-2">{stats.totalMedidasAtivas}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <TrendingDown size={28} className="text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas - Segunda Linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Card: Taxa de Absenteísmo */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Taxa de Absenteísmo</p>
              <p className="text-3xl font-bold text-[#2b3674] mt-2">
                {stats.totalColaboradores > 0
                  ? ((stats.totalAfastamentos / stats.totalColaboradores) * 100).toFixed(1)
                  : '0'}
                %
              </p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <TrendingDown size={28} className="text-purple-500" />
            </div>
          </div>
        </div>

        {/* Card: Férias em Andamento */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Férias em Andamento</p>
              <p className="text-3xl font-bold text-[#2b3674] mt-2">{stats.totalFeriasAtivas}</p>
            </div>
            <div className="bg-cyan-100 p-4 rounded-lg">
              <Clock size={28} className="text-cyan-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Absenteísmo por Mês */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-[#2b3674] mb-6">Absenteísmo por Mês (Últimos 6 Meses)</h3>

          {stats.graficoAbsenteismo.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.graficoAbsenteismo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="mes" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="faltas" fill="#2b3674" name="Quantidade de Faltas" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <p>Nenhum dado de absenteísmo disponível</p>
            </div>
          )}
        </div>

        {/* Gráfico de Colaboradores Ativos vs Inativos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-[#2b3674] mb-6">Distribuição de Colaboradores</h3>

          {stats.totalColaboradores > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.graficoColaradores}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.graficoColaradores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-500">
              <p>Nenhum colaborador cadastrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="bg-gradient-to-r from-[#2b3674] to-blue-600 rounded-lg shadow-md p-6 text-white">
        <h3 className="text-lg font-bold mb-4">Resumo Executivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-blue-100 text-sm">Taxa de Absenteísmo</p>
            <p className="text-2xl font-bold">
              {stats.totalColaboradores > 0
                ? ((stats.totalAfastamentos / stats.totalColaboradores) * 100).toFixed(1)
                : '0'}
              %
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Colaboradores Inativos</p>
            <p className="text-2xl font-bold">{stats.colaboradoresInativos}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Medidas Ativas</p>
            <p className="text-2xl font-bold">{stats.totalMedidasAtivas}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Férias em Andamento</p>
            <p className="text-2xl font-bold">{stats.totalFeriasAtivas}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
