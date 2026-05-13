import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { Upload, Download, Search, Trash2, Edit2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Afastamento {
  id: number;
  matricula: string;
  data_inicio: string | null;
  data_fim: string | null;
  motivo: string | null;
  cid: string | null;
  status: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

interface Colaborador {
  matricula: string;
  nome: string | null;
}

export default function Afastamentos() {
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    matricula: '',
    data_inicio: '',
    data_fim: '',
    motivo: '',
    cid: '',
    status: 'Em Andamento',
    observacoes: '',
  });

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [afastamentosRes, colaboradoresRes] = await Promise.all([
        supabase.from('afastamentos').select('*').order('created_at', { ascending: false }),
        supabase.from('colaboradores').select('matricula, nome'),
      ]);

      if (afastamentosRes.error) throw afastamentosRes.error;
      if (colaboradoresRes.error) throw colaboradoresRes.error;

      setAfastamentos(afastamentosRes.data || []);
      setColaboradores(colaboradoresRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar afastamentos
  const filteredAfastamentos = useMemo(() => {
    return afastamentos.filter((af) => {
      const searchLower = searchTerm.toLowerCase();
      const colaborador = colaboradores.find((c) => c.matricula === af.matricula);
      return (
        (af.matricula?.toLowerCase().includes(searchLower) || false) ||
        (colaborador?.nome?.toLowerCase().includes(searchLower) || false) ||
        (af.motivo?.toLowerCase().includes(searchLower) || false) ||
        (af.cid?.toLowerCase().includes(searchLower) || false)
      );
    });
  }, [afastamentos, colaboradores, searchTerm]);

  // Abrir modal para novo
  const handleOpenNewModal = () => {
    setEditingId(null);
    setFormData({
      matricula: '',
      data_inicio: '',
      data_fim: '',
      motivo: '',
      cid: '',
      status: 'Em Andamento',
      observacoes: '',
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleOpenEditModal = (afastamento: Afastamento) => {
    setEditingId(afastamento.id);
    setFormData({
      matricula: afastamento.matricula,
      // Garante que o input date receba apenas a parte YYYY-MM-DD
      data_inicio: afastamento.data_inicio ? afastamento.data_inicio.split('T')[0] : '',
      data_fim: afastamento.data_fim ? afastamento.data_fim.split('T')[0] : '',
      motivo: afastamento.motivo || '',
      cid: afastamento.cid || '',
      status: afastamento.status || 'Em Andamento',
      observacoes: afastamento.observacoes || '',
    });
    setShowModal(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      matricula: '',
      data_inicio: '',
      data_fim: '',
      motivo: '',
      cid: '',
      status: 'Em Andamento',
      observacoes: '',
    });
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.matricula || !formData.data_inicio) {
      toast.error('Matrícula e Data de Início são obrigatórias');
      return;
    }

    try {
      const data = {
        matricula: formData.matricula,
        data_inicio: formData.data_inicio || null,
        data_fim: formData.data_fim || null,
        motivo: formData.motivo || null,
        cid: formData.cid || null,
        status: formData.status,
        observacoes: formData.observacoes || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('afastamentos')
          .update(data)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Afastamento atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('afastamentos').insert([data]);

        if (error) throw error;
        toast.success('Afastamento adicionado com sucesso!');
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast.error('Erro ao salvar afastamento');
    }
  };

  // Deletar afastamento
  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este afastamento?')) {
      try {
        const { error } = await supabase.from('afastamentos').delete().eq('id', id);

        if (error) throw error;
        toast.success('Afastamento deletado com sucesso!');
        loadData();
      } catch (err) {
        console.error('Erro ao deletar:', err);
        toast.error('Erro ao deletar afastamento');
      }
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

  // CORREÇÃO: Função para formatar a data na tabela ignorando o fuso horário
  const formatarDataLocal = (dataString: string | null) => {
    if (!dataString) return '-';
    // Pega apenas a parte YYYY-MM-DD (ignorando o T00:00:00Z se existir no banco)
    const dataSemHora = dataString.split('T')[0]; 
    // Inverte de YYYY-MM-DD para DD/MM/YYYY
    return dataSemHora.split('-').reverse().join('/');
  };

  // Importar CSV
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const matriculaIndex = headers.indexOf('matricula');
      const dataInicioIndex = headers.indexOf('data_inicio');
      const dataFimIndex = headers.indexOf('data_fim');
      const motivoIndex = headers.indexOf('motivo');
      const cidIndex = headers.indexOf('cid');
      const statusIndex = headers.indexOf('status');
      const observacoesIndex = headers.indexOf('observacoes');

      if (matriculaIndex === -1 || dataInicioIndex === -1) {
        toast.error('CSV deve conter colunas "matricula" e "data_inicio"');
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

        if (!matricula || !dataInicio) {
          errorCount++;
          continue;
        }

        try {
          const novoAfastamento = {
            matricula,
            data_inicio: converterDataBrasileira(dataInicio),
            data_fim: values[dataFimIndex] ? converterDataBrasileira(values[dataFimIndex]) : null,
            motivo: values[motivoIndex] || null,
            cid: values[cidIndex] || null,
            status: values[statusIndex] || 'Em Andamento',
            observacoes: values[observacoesIndex] || null,
          };

          const { error } = await supabase.from('afastamentos').insert([novoAfastamento]);

          if (error) {
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      toast.success(`${successCount} afastamento(s) importado(s) com sucesso!`);
      if (errorCount > 0) {
        toast.warning(`${errorCount} linha(s) falharam na importação`);
      }
      loadData();
    } catch (err) {
      console.error('Erro ao processar CSV:', err);
      toast.error('Erro ao processar arquivo CSV');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  // Exportar CSV
  const handleExportCSV = () => {
    try {
      const headers = ['matricula', 'data_inicio', 'data_fim', 'motivo', 'cid', 'status', 'observacoes'];
      const rows = filteredAfastamentos.map((af) => [
        af.matricula,
        af.data_inicio ? af.data_inicio.split('T')[0] : '', // Exporta limpo também
        af.data_fim ? af.data_fim.split('T')[0] : '',
        af.motivo || '',
        af.cid || '',
        af.status || '',
        af.observacoes || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afastamentos_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Arquivo exportado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar arquivo');
    }
  };

  return (
    <Layout currentPage="afastamentos">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        {/* Pesquisa */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por matrícula, nome, motivo ou CID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#2b3674] text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus size={20} />
            <span>Novo</span>
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
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Carregando afastamentos...</p>
          </div>
        ) : filteredAfastamentos.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">
              {afastamentos.length === 0 ? 'Nenhum afastamento cadastrado' : 'Nenhum resultado encontrado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Matrícula</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Colaborador</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data Início</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data Fim</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Motivo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">CID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAfastamentos.map((afastamento, index) => {
                  const colaborador = colaboradores.find((c) => c.matricula === afastamento.matricula);
                  return (
                    <tr
                      key={afastamento.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#2b3674]">{afastamento.matricula}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{colaborador?.nome || '-'}</td>
                      
                      {/* Células atualizadas com a nova função */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatarDataLocal(afastamento.data_inicio)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatarDataLocal(afastamento.data_fim)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">{afastamento.motivo || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{afastamento.cid || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            afastamento.status === 'Em Andamento'
                              ? 'bg-blue-100 text-blue-800'
                              : afastamento.status === 'Concluído'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {afastamento.status || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(afastamento)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} className="text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(afastamento.id)}
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
                {editingId ? 'Editar Afastamento' : 'Novo Afastamento'}
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
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                <input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ex: Licença Médica"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CID</label>
                <input
                  type="text"
                  value={formData.cid}
                  onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
                  placeholder="Ex: M79.3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
