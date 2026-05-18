import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useColaborador } from '@/contexts/ColaboradorContext';
import { Plus, Trash2, Edit2, Search, X, Upload, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function Ferias() {
  const { ferias, colaboradores, loading, addFerias, deleteFerias, updateFerias } = useColaborador();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    matricula: '',
    data_inicio: '',
    data_fim: '',
    dias_utilizados: '',
    dias_restantes: '',
    observacoes: '',
  });

  // Filtrar férias por pesquisa
  const filteredFerias = useMemo(() => {
    return ferias.filter((f) => {
      const searchLower = searchTerm.toLowerCase();
      const colaborador = colaboradores.find((c) => c.matricula === f.matricula);
      return (
        (f.matricula?.toLowerCase().includes(searchLower) || false) ||
        (colaborador?.nome?.toLowerCase().includes(searchLower) || false)
      );
    });
  }, [ferias, colaboradores, searchTerm]);

  // Formatar data para YYYY-MM-DD no input type="date"
  const formatarDataInput = (data: string | null) => {
    if (!data) return '';
    return data.split('T')[0];
  };

  const handleOpenModal = (feria?: typeof ferias[0]) => {
    if (feria) {
      setEditingId(feria.id);
      setFormData({
        matricula: feria.matricula,
        data_inicio: formatarDataInput(feria.data_inicio),
        data_fim: formatarDataInput(feria.data_fim),
        dias_utilizados: feria.dias_utilizados?.toString() || '',
        dias_restantes: feria.dias_restantes?.toString() || '',
        observacoes: feria.observacoes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        matricula: '',
        data_inicio: '',
        data_fim: '',
        dias_utilizados: '',
        dias_restantes: '',
        observacoes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      matricula: '',
      data_inicio: '',
      data_fim: '',
      dias_utilizados: '',
      dias_restantes: '',
      observacoes: '',
    });
  };

  // NOVA FUNÇÃO: Calcula os dias automaticamente quando escolhe as datas
  const handleDateChange = (field: 'data_inicio' | 'data_fim', value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Se ambas as datas estiverem preenchidas, fazemos a matemática
      if (newData.data_inicio && newData.data_fim) {
        // Usa UTC para evitar que o fuso horário roube 1 dia no cálculo
        const inicio = new Date(`${newData.data_inicio}T00:00:00Z`);
        const fim = new Date(`${newData.data_fim}T00:00:00Z`);
        
        if (fim >= inicio) {
          // Calcula a diferença em milissegundos e converte para dias
          const diffTime = fim.getTime() - inicio.getTime();
          // Soma 1 para incluir o próprio dia de início no cálculo
          const diasUsados = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          // Assumimos 30 dias de direito por padrão
          const diasRestantes = 30 - diasUsados;
          
          newData.dias_utilizados = diasUsados.toString();
          newData.dias_restantes = diasRestantes >= 0 ? diasRestantes.toString() : '0';
        }
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.matricula || !formData.data_inicio || !formData.data_fim) {
      toast.error('Matrícula, Data de Início e Fim são obrigatórias');
      return;
    }

    try {
      const data = {
        matricula: formData.matricula,
        data_inicio: formData.data_inicio || null,
        data_fim: formData.data_fim || null,
        dias_utilizados: formData.dias_utilizados ? parseInt(formData.dias_utilizados) : null,
        dias_restantes: formData.dias_restantes ? parseInt(formData.dias_restantes) : null,
        observacoes: formData.observacoes || null,
      };

      if (editingId) {
        await updateFerias(editingId, data);
        toast.success('Férias atualizadas com sucesso!');
      } else {
        await addFerias(data);
        toast.success('Férias adicionadas com sucesso!');
      }

      handleCloseModal();
    } catch (err) {
      toast.error('Erro ao salvar férias');
    }
  };

  // Converter data DD/MM/AAAA para YYYY-MM-DD
  const converterDataBrasileira = (data: string): string | null => {
    if (!data || data.trim() === '') return null;
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = data.match(regex);
    if (!match) return null;
    const dia = String(match[1]).padStart(2, '0');
    const mes = String(match[2]).padStart(2, '0');
    const ano = match[3];
    return `${ano}-${mes}-${dia}`;
  };

  // Formatar a data na tabela ignorando fuso horário
  const formatarDataLocal = (dataString: string | null) => {
    if (!dataString) return '-';
    const dataSemHora = dataString.split('T')[0]; 
    return dataSemHora.split('-').reverse().join('/');
  };

  // Extrair e formatar o mês por extenso com base na data de início
  const obterMesReferencia = (dataString: string | null) => {
    if (!dataString) return '-';
    const dataSemHora = dataString.split('T')[0];
    const [, mesIncorreto] = dataSemHora.split('-');
    
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const indice = parseInt(mesIncorreto, 10) - 1;
    return meses[indice] || '-';
  };

  // Calcular Status Dinâmico Automático
  const calcularStatusAutomatico = (dataInicioStr: string | null, dataFimStr: string | null) => {
    if (!dataInicioStr || !dataFimStr) return 'Não Definido';
    
    const inicioLimpo = dataInicioStr.split('T')[0];
    const fimLimpo = dataFimStr.split('T')[0];
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split('T')[0];

    if (hojeStr < inicioLimpo) {
      return 'Agendada';
    } else if (hojeStr >= inicioLimpo && hojeStr <= fimLimpo) {
      return 'Em Andamento';
    } else {
      return 'Concluída';
    }
  };

  // Importar CSV
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const matriculaIndex = headers.indexOf('matricula');
      const dataInicioIndex = headers.indexOf('data_inicio');
      const dataFimIndex = headers.indexOf('data_fim');
      const diasUtilizadosIndex = headers.indexOf('dias_utilizados');
      const diasRestantesIndex = headers.indexOf('dias_restantes');
      const observacoesIndex = headers.indexOf('observacoes');

      if (matriculaIndex === -1 || dataInicioIndex === -1 || dataFimIndex === -1) {
        toast.error('CSV deve conter matricula, data_inicio e data_fim');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map((v) => v.trim());
        const matricula = values[matriculaIndex];
        const dataInicio = values[dataInicioIndex];
        const dataFim = values[dataFimIndex];

        if (!matricula || !dataInicio || !dataFim) {
          errorCount++;
          continue;
        }

        try {
          const novaFeria = {
            matricula,
            data_inicio: converterDataBrasileira(dataInicio),
            data_fim: converterDataBrasileira(dataFim),
            dias_utilizados: values[diasUtilizadosIndex] ? parseInt(values[diasUtilizadosIndex]) : null,
            dias_restantes: values[diasRestantesIndex] ? parseInt(values[diasRestantesIndex]) : null,
            observacoes: values[observacoesIndex] || null,
          };

          await addFerias(novaFeria);
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      toast.success(`${successCount} férias importadas com sucesso!`);
      if (errorCount > 0) {
        toast.warning(`${errorCount} linha(s) falharam na importação`);
      }
    } catch (err) {
      console.error('Erro ao processar CSV:', err);
      toast.error('Erro ao processar arquivo CSV');
    } finally {
      event.target.value = '';
    }
  };

  // Exportar CSV
  const handleExportCSV = () => {
    try {
      const headers = ['matricula', 'data_inicio', 'data_fim', 'dias_utilizados', 'dias_restantes', 'observacoes'];
      const rows = filteredFerias.map((f) => [
        f.matricula,
        f.data_inicio ? f.data_inicio.split('T')[0] : '',
        f.data_fim ? f.data_fim.split('T')[0] : '',
        f.dias_utilizados || '',
        f.dias_restantes || '',
        f.observacoes || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ferias_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Arquivo exportado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar arquivo');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este registro de férias?')) {
      try {
        await deleteFerias(id);
        toast.success('Férias deletadas com sucesso!');
      } catch (err) {
        toast.error('Erro ao deletar férias');
      }
    }
  };

  return (
    <Layout currentPage="ferias">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por matrícula ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#2b3674] text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus size={20} />
            <span>Novas Férias</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            <span>Exportar</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-[#2b3674] text-white rounded-lg hover:bg-blue-800 transition-colors cursor-pointer">
            <Upload size={20} />
            <span>Importar</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Tabela de Férias */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Carregando férias...</p>
          </div>
        ) : filteredFerias.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">
              {ferias.length === 0 ? 'Nenhuma féria cadastrada' : 'Nenhum resultado encontrado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Matrícula</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Colaborador</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mês Ref.</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Início</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fim</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Dias Utilizados</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFerias.map((feria, index) => {
                  const colaborador = colaboradores.find((c) => c.matricula === feria.matricula);
                  const statusDinamico = calcularStatusAutomatico(feria.data_inicio, feria.data_fim);
                  
                  return (
                    <tr
                      key={feria.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#2b3674]">{feria.matricula}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{colaborador?.nome || '-'}</td>
                      
                      <td className="px-6 py-4 text-sm font-medium text-gray-600 flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {obterMesReferencia(feria.data_inicio)}
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatarDataLocal(feria.data_inicio)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatarDataLocal(feria.data_fim)}
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-700">{feria.dias_utilizados || '-'}</td>
                      
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusDinamico === 'Concluída'
                              ? 'bg-green-100 text-green-800'
                              : statusDinamico === 'Em Andamento'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {statusDinamico}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(feria)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} className="text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(feria.id)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dica de Importação */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Para importar férias, prepare um arquivo CSV com as colunas:
          <code className="bg-white px-2 py-1 rounded ml-2 font-mono text-xs shadow-sm">
            matricula, data_inicio, data_fim, dias_utilizados, dias_restantes, observacoes
          </code>
        </p>
        <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
          <span className="font-semibold">Importante:</span> As datas devem estar no formato DD/MM/AAAA (ex: 15/01/2020)
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#2b3674]">
                {editingId ? 'Editar Férias' : 'Novas Férias'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador *</label>
                <select
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um colaborador</option>
                  {colaboradores.map((col) => (
                    <option key={col.matricula} value={col.matricula}>
                      {col.matricula} - {col.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início *</label>
                <input
                  type="date"
                  value={formData.data_inicio}
                  // Chama a nossa nova função matemática!
                  onChange={(e) => handleDateChange('data_inicio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim *</label>
                <input
                  type="date"
                  value={formData.data_fim}
                  // Chama a nossa nova função matemática!
                  onChange={(e) => handleDateChange('data_fim', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dias Utilizados</label>
                <input
                  type="number"
                  value={formData.dias_utilizados}
                  onChange={(e) => setFormData({ ...formData, dias_utilizados: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dias Restantes</label>
                <input
                  type="number"
                  value={formData.dias_restantes}
                  onChange={(e) => setFormData({ ...formData, dias_restantes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Base de cálculo: 30 dias"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#2b3674] text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  {editingId ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
