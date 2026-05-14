import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit2, Search, X, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Rotatividade {
  id: number;
  matricula: string;
  data_saida: string | null;
  motivo: string | null;
  descricao: string | null;
  departamento_destino: string | null;
  responsavel_desligamento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

interface Colaborador {
  matricula: string;
  nome: string | null;
}

const MOTIVOS_ROTATIVIDADE = [
  'Transferência Interna',
  'Pedido de Desligamento',
  'Desligamento por Justa Causa',
  'Desligamento sem Justa Causa',
  'Aposentadoria',
  'Falecimento',
  'Outro',
];

export default function Rotatividade() {
  const [rotatividades, setRotatividades] = useState<Rotatividade[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    matricula: '',
    data_saida: '',
    motivo: '',
    descricao: '',
    departamento_destino: '',
    responsavel_desligamento: '',
    observacoes: '',
  });

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rotatividades, colaboradores] = await Promise.all([
        supabase.from('rotatividade').select('*').order('created_at', { ascending: false }),
        supabase.from('colaboradores').select('matricula, nome'),
      ]);

      if (rotatividades.error) throw rotatividades.error;
      if (colaboradores.error) throw colaboradores.error;

      setRotatividades(rotatividades.data || []);
      setColaboradores(colaboradores.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar rotatividades
  const filteredRotatividades = useMemo(() => {
    return rotatividades.filter((rot) => {
      const searchLower = searchTerm.toLowerCase();
      const colaborador = colaboradores.find((c) => c.matricula === rot.matricula);
      return (
        (rot.matricula?.toLowerCase().includes(searchLower) || false) ||
        (colaborador?.nome?.toLowerCase().includes(searchLower) || false) ||
        (rot.motivo?.toLowerCase().includes(searchLower) || false)
      );
    });
  }, [rotatividades, colaboradores, searchTerm]);

  // Abrir modal para novo
  const handleOpenNewModal = () => {
    setEditingId(null);
    setFormData({
      matricula: '',
      data_saida: '',
      motivo: '',
      descricao: '',
      departamento_destino: '',
      responsavel_desligamento: '',
      observacoes: '',
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleOpenEditModal = (rotatividade: Rotatividade) => {
    setEditingId(rotatividade.id);
    // Formatar data para YYYY-MM-DD para o input type="date"
    const formatarData = (data: string | null) => {
      if (!data) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
      try {
        const d = new Date(data);
        return d.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };
    setFormData({
      matricula: rotatividade.matricula,
      data_saida: formatarData(rotatividade.data_saida),
      motivo: rotatividade.motivo || '',
      descricao: rotatividade.descricao || '',
      departamento_destino: rotatividade.departamento_destino || '',
      responsavel_desligamento: rotatividade.responsavel_desligamento || '',
      observacoes: rotatividade.observacoes || '',
    });
    setShowModal(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      matricula: '',
      data_saida: '',
      motivo: '',
      descricao: '',
      departamento_destino: '',
      responsavel_desligamento: '',
      observacoes: '',
    });
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.matricula || !formData.data_saida) {
      toast.error('Matrícula e Data de Saída são obrigatórias');
      return;
    }

    try {
      const data = {
        matricula: formData.matricula,
        data_saida: formData.data_saida || null,
        motivo: formData.motivo || null,
        descricao: formData.descricao || null,
        departamento_destino: formData.departamento_destino || null,
        responsavel_desligamento: formData.responsavel_desligamento || null,
        observacoes: formData.observacoes || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('rotatividade')
          .update(data)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Rotatividade atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('rotatividade').insert([data]);

        if (error) throw error;
        toast.success('Rotatividade adicionada com sucesso!');
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast.error('Erro ao salvar rotatividade');
    }
  };

  // Deletar rotatividade
  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este registro de rotatividade?')) {
      try {
        const { error } = await supabase.from('rotatividade').delete().eq('id', id);

        if (error) throw error;
        toast.success('Rotatividade deletada com sucesso!');
        loadData();
      } catch (err) {
        console.error('Erro ao deletar:', err);
        toast.error('Erro ao deletar rotatividade');
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
    const dataSemHora = dataString.split('T')[0]; 
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
      const dataSaidaIndex = headers.indexOf('data_saida');
      const motivoIndex = headers.indexOf('motivo');
      const descricaoIndex = headers.indexOf('descricao');
      const departamentoDestinoIndex = headers.indexOf('departamento_destino');
      const responsavelDesligamentoIndex = headers.indexOf('responsavel_desligamento');
      const observacoesIndex = headers.indexOf('observacoes');

      if (matriculaIndex === -1 || dataSaidaIndex === -1) {
        toast.error('CSV deve conter colunas "matricula" e "data_saida"');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map((v) => v.trim());
        const matricula = values[matriculaIndex];
        const dataSaida = values[dataSaidaIndex];

        if (!matricula || !dataSaida) {
          errorCount++;
          continue;
        }

        try {
          const novaRotatividade = {
            matricula,
            data_saida: converterDataBrasileira(dataSaida),
            motivo: values[motivoIndex] || null,
            descricao: values[descricaoIndex] || null,
            departamento_destino: values[departamentoDestinoIndex] || null,
            responsavel_desligamento: values[responsavelDesligamentoIndex] || null,
            observacoes: values[observacoesIndex] || null,
          };

          await supabase.from('rotatividade').insert([novaRotatividade]);
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      toast.success(`${successCount} rotatividade(s) importada(s) com sucesso!`);
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
      const headers = ['matricula', 'data_saida', 'motivo', 'descricao', 'departamento_destino', 'responsavel_desligamento', 'observacoes'];
      const rows = filteredRotatividades.map((rot) => [
        rot.matricula,
        rot.data_saida ? rot.data_saida.split('T')[0] : '', // Exporta limpo
        rot.motivo || '',
        rot.descricao || '',
        rot.departamento_destino || '',
        rot.responsavel_desligamento || '',
        rot.observacoes || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rotatividade_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Arquivo exportado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar arquivo');
    }
  };

  return (
    <Layout currentPage="rotatividade">
      {/* Header com Pesquisa e Botões */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        {/* Pesquisa */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por matrícula, nome ou motivo..."
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
            <p className="text-gray-500">Carregando rotatividades...</p>
          </div>
        ) : filteredRotatividades.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">
              {rotatividades.length === 0 ? 'Nenhuma rotatividade cadastrada' : 'Nenhum resultado encontrado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Matrícula</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Colaborador</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data Saída</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Motivo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Descrição</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Responsável</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRotatividades.map((rotatividade, index) => {
                  const colaborador = colaboradores.find((c) => c.matricula === rotatividade.matricula);
                  return (
                    <tr
                      key={rotatividade.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#2b3674]">{rotatividade.matricula}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{colaborador?.nome || '-'}</td>
                      
                      {/* Utilizando a nova função de formatação de data para evitar bug de fuso horário */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatarDataLocal(rotatividade.data_saida)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">{rotatividade.motivo || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{rotatividade.descricao || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{rotatividade.responsavel_desligamento || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(rotatividade)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} className="text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(rotatividade.id)}
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

      {/* DICA DE IMPORTAÇÃO PARA ROTATIVIDADE */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Para importar registos de rotatividade, prepare um arquivo CSV com as colunas:
          <code className="bg-white px-2 py-1 rounded ml-2 font-mono text-xs shadow-sm">
            matricula, data_saida, motivo, descricao, departamento_destino, responsavel_desligamento, observacoes
          </code>
        </p>
        <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
          <span className="font-semibold">Importante:</span> As datas devem estar no formato DD/MM/AAAA (ex: 15/01/2020)
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#2b3674]">
                {editingId ? 'Editar Rotatividade' : 'Nova Rotatividade'}
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

              {/* Data Saída */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Saída *</label>
                <input
                  type="date"
                  value={formData.data_saida}
                  onChange={(e) => setFormData({ ...formData, data_saida: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <select
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um motivo</option>
                  {MOTIVOS_ROTATIVIDADE.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Departamento Destino */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento Destino (Transferência)</label>
                <input
                  type="text"
                  value={formData.departamento_destino}
                  onChange={(e) => setFormData({ ...formData, departamento_destino: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: TI, RH, Vendas"
                />
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável pelo Desligamento</label>
                <input
                  type="text"
                  value={formData.responsavel_desligamento}
                  onChange={(e) => setFormData({ ...formData, responsavel_desligamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do responsável"
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
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2b3674] text-white rounded-lg hover:bg-blue-800 transition-colors"
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
