import React, { useMemo, useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { useColaborador } from '@/contexts/ColaboradorContext';
import { supabase } from '@/lib/supabase';
import { Users, AlertCircle, TrendingDown, Clock, Activity, BarChart2, CheckCircle2, CalendarDays } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface Ferias {
  id: number;
  matricula: string;
  data_inicio: string | null;
  data_fim: string | null;
  status?: string;
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
    const totalMedidasAtivas = medidas.filter((m) => m.status === 'Ativa').length;

    // Lógica de Status Automática e Filtro Anual para Férias
    const anoAtual = new Date().getFullYear();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split('T')[0];

    let feriasAgendadas = 0;
    let feriasEmAndamento = 0;
    let feriasConcluidasNoAno = 0;

    ferias.forEach((f) => {
      if (!f.data_inicio || !f.data_fim) return;
      
      const inicioLimpo = f.data_inicio.split('T')[0];
      const fimLimpo = f.data_fim.split('T')[0];

      // Determinar o status dinamicamente
      if (hojeStr < inicioLimpo) {
        feriasAgendadas++;
      } else if (hojeStr >= inicioLimpo && hojeStr <= fimLimpo) {
        feriasEmAndamento++;
      } else {
        // Se já concluiu, verifica se foi dentro do ano atual
        const anoFim = new Date(fimLimpo).getFullYear();
        if (anoFim === anoAtual) {
          feriasConcluidasNoAno++;
        }
      }
    });

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
      totalMedidasAtivas,
      feriasAgendadas,
      feriasEmAndamento,
      feriasConcluidasNoAno,
      graficoAbsenteismo,
      graficoColaboradores,
      anoAtual
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

      {/* Cards de Indicadores Rápidos (Atualizado com sub-detalhamentos de Férias) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-10">
        
        {/* Card 1: Total Colaboradores */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group xl:col-span-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <Users size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-[#2b3674] tracking-tight">{stats.totalColaboradores}</h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Total de Colaboradores</p>
          </div>
        </div>

        {/* Card 2: Afastamentos */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group xl:col-span-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-105 transition-transform">
              <AlertCircle size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-[#2b3674] tracking-tight">{stats.totalAfastamentos}</h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Afastamentos Ativos</p>
          </div>
        </div>

        {/* Card 3: Medidas Disciplinares */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group xl:col-span-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl group-hover:scale-105 transition-transform">
              <TrendingDown size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-[#2b3674] tracking-tight">{stats.totalMedidasAtivas}</h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Medidas Disciplinares</p>
          </div>
        </div>

        {/* CARD NOVO 4: Férias Agendadas */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group xl:col-span-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl group-hover:scale-105 transition-transform">
              <CalendarDays size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-[#2b3674] tracking-tight">{stats.feriasAgendadas}</h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Férias Agendadas (Futuras)</p>
          </div>
        </div>

        {/* CARD NOVO 5: Férias Em Andamento */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group xl:col-span-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <Clock size={22} strokeWidth={2.5} />
            </div>
            {stats.feriasEmAndamento > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-[#2b3674] tracking-tight">{stats.feriasEmAndamento}</h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Férias em Andamento (Hoje)</p>
          </div>
        </div>

        {/* CARD NOVO 6: Férias Concluídas no Ano */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group xl:col-span-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
              <CheckCircle2 size={22} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-[#2b3674] tracking-tight">{stats.feriasConcluidasNoAno}</h3>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Férias Concluídas em {stats.anoAtual}</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Gráfico de Absenteísmo */}
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

        {/* Gráfico de Composição do Efetivo */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Activity size={20} />
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
