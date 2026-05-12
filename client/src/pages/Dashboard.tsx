import React, { useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useColaborador } from '@/contexts/ColaboradorContext';
import { Users, AlertCircle, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const { colaboradores, faltas, loading } = useColaborador();

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalColaboradores = colaboradores.length;
    const totalAfastamentos = faltas.length;
    
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

    const graficoAbsenteismo = Object.values(absenteismoPorMes).sort((a, b) => {
      const [mesA, anoA] = a.mes.split('/');
      const [mesB, anoB] = b.mes.split('/');
      return new Date(parseInt(anoA), parseInt(mesA) - 1).getTime() - new Date(parseInt(anoB), parseInt(mesB) - 1).getTime();
    });

    return {
      totalColaboradores,
      totalAfastamentos,
      graficoAbsenteismo,
    };
  }, [colaboradores, faltas]);

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
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card: Total de Colaboradores */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Colaboradores</p>
              <p className="text-3xl font-bold text-[#2b3674] mt-2">{stats.totalColaboradores}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <Users size={32} className="text-blue-500" />
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
              <AlertCircle size={32} className="text-orange-500" />
            </div>
          </div>
        </div>

        {/* Card: Taxa de Absenteísmo */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
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
            <div className="bg-red-100 p-4 rounded-lg">
              <TrendingDown size={32} className="text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Absenteísmo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-[#2b3674] mb-6">Absenteísmo por Mês</h3>
        
        {stats.graficoAbsenteismo.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stats.graficoAbsenteismo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="mes" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                formatter={(value) => [value, 'Faltas']}
              />
              <Legend />
              <Bar dataKey="faltas" fill="#2b3674" name="Quantidade de Faltas" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500">
            <p>Nenhum dado de absenteísmo disponível</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
