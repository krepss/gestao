import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useColaborador } from '@/contexts/ColaboradorContext';
import { Plus, Trash2, Edit2, Search, X, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function Medidas() {
  const { medidas, colaboradores, loading, addMedida, deleteMedida, updateMedida } = useColaborador();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    matricula: '',
    tipo_medida: '',
    data_aplicacao: '',
    motivo: '',
    descricao: '',
    status: 'Ativa',
    data_encerramento: '',
    observacoes: '',
  });

  // Filtrar medidas por pesquisa
  const filteredMedidas = useMemo(() => {
    return medidas.filter((m) => {
      const searchLower = searchTerm.toLowerCase();
      const colaborador = colaboradores.find((c) => c.matricula === m.matricula);
      return (
        (m.matricula?.toLowerCase().includes(searchLower) || false) ||
        (colaborador?.nome?.toLowerCase().includes(searchLower) || false) ||
        (m.tipo_medida?.toLowerCase().includes(searchLower) || false)
      );
    });
  }, [medidas, colaboradores, searchTerm]);

  const handleOpenModal = (medida?: typeof medidas[0]) => {
    if (medida) {
      setEditingId(medida.id);
      setFormData({
        matricula: medida.matricula,
        tipo_medida: medida.tipo_medida || '',
        data_aplicacao: medida.data_aplicacao || '',
        motivo: medida.motivo || '',
        descricao: medida.descricao || '',
        status: medida.status || 'Ativa',
        data_encerramento: medida.data_encerramento || '',
        observacoes: medida.observacoes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        matricula: '',
        tipo_medida: '',
        data_aplicacao: '',
        motivo: '',
        descricao: '',
        status: 'Ativa',
        data_encerramento: '',
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
      tipo_medida: '',
      data_aplicacao: '',
      motivo: '',
      descricao: '',
      status: 'Ativa',
      data_encerramento: '',
      observacoes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.matricula) {
      toast.error('Selecione um colaborador');
      return;
    }

    try {
      const data = {
        matricula: formData.matricula,
        tipo_medida: formData.tipo_medida || null,
        data_aplicacao: formData.data_aplicacao || null,
        motivo: formData.motivo || null,
        descricao: formData.descricao || null,
        status: formData.status,
        data_encerramento: formData.data_encerramento || null,
        observacoes: formData.observacoes || null,
      };

      if (editingId) {
        await updateMedida(editingId, data);
        toast.success('Medida atualizada com sucesso!');
      } else {
        await addMedida(data);
        toast.success('Medida adicionada com sucesso!');
      }

      handleCloseModal();
    } catch (err) {
      toast.error('Erro ao salvar medida');
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

  // Importar CSV
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const matriculaIndex = headers.indexOf('matricula');
      const tipoMedidaIndex = headers.indexOf('tipo_medida');
      const dataAplicacaoIndex = headers.indexOf('data_aplicacao');
      const motivoIndex = headers.indexOf('motivo');
      const descricaoIndex = headers.indexOf('descricao');
      const statusIndex = headers.indexOf('status');
      const dataEncerramentoIndex = headers.indexOf('data_encerramento');
      const observacoesIndex = headers.indexOf('observacoes');

      if (matriculaIndex === -1) {
        toast.error('CSV deve conter coluna "matricula"');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map((v) => v.trim());
        const matricula = values[matriculaIndex];

        if (!matricula) {
          errorCount++;
          continue;
        }

        try {
          const novaMedida = {
            matricula,
            tipo_medida: values[tipoMedidaIndex] || null,
            data_aplicacao: values[dataAplicacaoIndex] ? converterDataBrasileira(values[dataAplicacaoIndex]) : null,
            motivo: values[motivoIndex] || null,
            descricao: values[descricaoIndex] || null,
            status: values[statusIndex] || 'Ativa',
            data_encerramento: values[dataEncerramentoIndex] ? converterDataBrasileira(values[dataEncerramentoIndex]) : null,
            observacoes: values[observacoesIndex] || null,
          };

          await addMedida(novaMedida);
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      toast.success(`${successCount} medida(s) importada(s) com sucesso!`);
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
      const headers = ['matricula', 'tipo_medida', 'data_aplicacao', 'motivo', 'descricao', 'status', 'data_encerramento', 'observacoes'];
      const rows = filteredMedidas.map((m) => [
        m.matricula,
        m.tipo_medida || '',
        m.data_aplicacao || '',
        m.motivo || '',
        m.descricao || '',
        m.status || '',
        m.data_encerramento || '',
        m.observacoes || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medidas_disciplinares_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Arquivo exportado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar arquivo');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar esta medida disciplinar?')) {
      try {
        await deleteMedida(id);
        toast.success('Medida deletada com sucesso!');
      } catch (err) {
        toast.error('Erro ao deletar medida');
      }
    }
  };

  return (
    <Layout currentPage="medidas">
      {/* Header com Pesquisa e Botão Novo */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        {/* Pesquisa */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por matrícula, nome ou tipo de medida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#2b3674] text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus size={20} />
            <span>Nova Medida</span>
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

      {/* Tabela de Medidas */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Carregando medidas...</p>
          </div>
        ) : filteredMedidas.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">
              {medidas.length === 0 ? 'Nenhuma medida cadastrada' : 'Nenhum resultado encontrado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Matrícula</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Colaborador</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tipo de Medida</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data Aplicação</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Motivo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedidas.map((medida, index) => {
                  const colaborador = colaboradores.find((c) => c.matricula === medida.matricula);
                  return (
                    <tr
                      key={medida.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#2b3674]">{medida.matricula}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{colaborador?.nome || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{medida.tipo_medida || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {medida.data_aplicacao
                          ? new Date(medida.data_aplicacao).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 truncate max-w-xs">
                        {medida.motivo || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            medida.status === 'Ativa'
                              ? 'bg-red-100 text-red-800'
                              : medida.status === 'Encerrada'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {medida.status || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(medida)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} className="text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(medida.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#2b3674]">
                {editingId ? 'Editar Medida' : 'Nova Medida Disciplinar'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Colaborador */}
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

              {/* Tipo de Medida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Medida</label>
                <select
                  value={formData.tipo_medida}
                  onChange={(e) => setFormData({ ...formData, tipo_medida: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um tipo</option>
                  <option value="Advertência Verbal">Advertência Verbal</option>
                  <option value="Advertência Escrita">Advertência Escrita</option>
                  <option value="Suspensão">Suspensão</option>
                </select>
              </div>

              {/* Data Aplicação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Aplicação</label>
                <input
                  type="date"
                  value={formData.data_aplicacao}
                  onChange={(e) => setFormData({ ...formData, data_aplicacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Atraso recorrente"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Ativa">Ativa</option>
                  <option value="Encerrada">Encerrada</option>
                </select>
              </div>

              {/* Data Encerramento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Encerramento</label>
                <input
                  type="date"
                  value={formData.data_encerramento}
                  onChange={(e) => setFormData({ ...formData, data_encerramento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              {/* Botões */}
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
