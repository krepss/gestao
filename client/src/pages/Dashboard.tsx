import React, { useMemo, useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useColaborador } from '@/contexts/ColaboradorContext';
import { supabase } from '@/lib/supabase';
import { Users, AlertCircle, TrendingDown, Clock, Activity, BarChart2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
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
      .slice(-6);

    // Dados para o gráfico de pizza
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
  }, [colaboradores, faltas, ferias, medidas, afastamentos]);

  if (loading) {
    return (
      <Layout currentPage="dashboard">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <Activity className="text-[#2b3674] animate-pulse" size={48} />
          <p className="text-gray-500 font-medium">Sincronizando indicadores...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="dashboard">
      
      {/* Título de Boas-Vindas Clean */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2b3674]">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Acompanhe os principais indicadores de gestão de talentos da sua empresa.</p>
      </div>

      {/* Cards de Indicadores Rápidos (Novo Design) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Users size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-[#2b3674] tracking-tight">{stats.totalColaboradores}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">Total de Colaboradores</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
              <AlertCircle size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-[#2b3674] tracking-tight">{stats.totalAfastamentos}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">Afastamentos Ativos</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
              <Clock size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-[#2b3674] tracking-tight">{stats.totalFeriasAtivas}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">Férias Agendadas</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingDown size={24} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-[#2b3674] tracking-tight">{stats.totalMedidasAtivas}</h3>
            <p className="text-sm font-medium text-gray-500 mt-1">Medidas Disciplinares</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Gráfico de Absenteísmo (Ocupa 2 colunas) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <BarChart2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#2b3674]">Tendência de Absenteísmo (Faltas)</h3>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.graficoAbsenteismo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="faltas" name="Total de Faltas" fill="#2b3674" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Composição do Efetivo (Ocupa 1 coluna) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <PieChart size={20} />
            </div>
            <h3 className="text-lg font-bold text-[#2b3674]">Status do Efetivo</h3>
          </div>

          <div className="h-64 relative">
            {stats.totalColaboradores > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.graficoColaboradores}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.graficoColaboradores.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Texto central do Donut Chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-[#2b3674]">{stats.colaboradoresAtivos}</span>
                  <span className="text-xs font-medium text-gray-500">ATIVOS</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Users size={40} className="mb-2 opacity-50" />
                <p>Sem dados cadastrados</p>
              </div>
            )}
          </div>
          
          {/* Legenda Customizada */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
              <span className="text-sm font-medium text-gray-600">Ativos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
              <span className="text-sm font-medium text-gray-600">Inativos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Resumo Executivo */}
      <div className="bg-gradient-to-br from-[#1e2759] to-[#2b3674] rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
        {/* Efeito visual de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
          <Activity className="text-blue-300" size={24} />
          Painel Executivo
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          <div className="bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/10">
            <p className="text-blue-200 text-sm font-medium mb-1">Taxa de Afastamento</p>
            <p className="text-3xl font-bold tracking-tight">
              {stats.totalColaboradores > 0
                ? ((stats.totalAfastamentos / stats.totalColaboradores) * 100).toFixed(1)
                : '0.0'}
              <span className="text-lg text-blue-300 ml-1">%</span>
            </p>
          </div>
          
          <div className="bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/10">
            <p className="text-blue-200 text-sm font-medium mb-1">Efetivo Ativo</p>
            <p className="text-3xl font-bold tracking-tight">{stats.colaboradoresAtivos}</p>
          </div>

          <div className="bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/10">
            <p className="text-blue-200 text-sm font-medium mb-1">Inativos Totais</p>
            <p className="text-3xl font-bold tracking-tight">{stats.colaboradoresInativos}</p>
          </div>
          
          <div className="bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/10">
            <p className="text-blue-200 text-sm font-medium mb-1">Intervenções Abertas</p>
            <p className="text-3xl font-bold tracking-tight">{stats.totalMedidasAtivas}</p>
          </div>
        </div>
      </div>

    </Layout>
  );
}
