import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit2, Search, X, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: number;
  matricula: string;
  data_feedback: string | null;
  tipo_feedback: string | null;
  assunto: string | null;
  descricao: string | null;
  pontos_positivos: string | null;
  pontos_melhorar: string | null;
  proximas_acoes: string | null;
  responsavel_feedback: string | null;
  status: string | null;
  data_proxima_revisao: string | null;
  observacoes: string | null;
}

interface Colaborador {
  matricula: string;
  nome: string | null;
}

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [formData, setFormData] = useState({
    matricula: '',
    data_feedback: '',
    tipo_feedback: 'Alinhamento',
    assunto: '',
    descricao: '',
    pontos_positivos: '',
    pontos_melhorar: '',
    proximas_acoes: '',
    responsavel_feedback: '',
    status: 'Aberto',
    data_proxima_revisao: '',
    observacoes: '',
  });

  // Carregar feedbacks e colaboradores
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [feedbacksRes, colaboradoresRes] = await Promise.all([
          supabase.from('feedbacks').select('*').order('data_feedback', { ascending: false }),
          supabase.from('colaboradores').select('matricula, nome'),
        ]);

        if (feedbacksRes.error) throw feedbacksRes.error;
        if (colaboradoresRes.error) throw colaboradoresRes.error;

        setFeedbacks(feedbacksRes.data || []);
        setColaboradores(colaboradoresRes.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrar feedbacks por pesquisa
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const searchLower = searchTerm.toLowerCase();
      const colaborador = colaboradores.find((c) => c.matricula === f.matricula);
      return (
        (f.matricula?.toLowerCase().includes(searchLower) || false) ||
        (colaborador?.nome?.toLowerCase().includes(searchLower) || false) ||
        (f.assunto?.toLowerCase().includes(searchLower) || false) ||
        (f.tipo_feedback?.toLowerCase().includes(searchLower) || false)
      );
    });
  }, [feedbacks, colaboradores, searchTerm]);

  // Abrir modal para novo feedback
  const handleOpenNewModal = () => {
    setEditingId(null);
    setFormData({
      matricula: '',
      data_feedback: new Date().toISOString().split('T')[0],
      tipo_feedback: 'Alinhamento',
      assunto: '',
      descricao: '',
      pontos_positivos: '',
      pontos_melhorar: '',
      proximas_acoes: '',
      responsavel_feedback: '',
      status: 'Aberto',
      data_proxima_revisao: '',
      observacoes: '',
    });
    setShowModal(true);
  };

  // Abrir modal para editar feedback
  const handleOpenEditModal = (feedback: Feedback) => {
    setEditingId(feedback.id);
    setFormData({
      matricula: feedback.matricula,
      data_feedback: feedback.data_feedback || '',
      tipo_feedback: feedback.tipo_feedback || 'Alinhamento',
      assunto: feedback.assunto || '',
      descricao: feedback.descricao || '',
      pontos_positivos: feedback.pontos_positivos || '',
      pontos_melhorar: feedback.pontos_melhorar || '',
      proximas_acoes: feedback.proximas_acoes || '',
      responsavel_feedback: feedback.responsavel_feedback || '',
      status: feedback.status || 'Aberto',
      data_proxima_revisao: feedback.data_proxima_revisao || '',
      observacoes: feedback.observacoes || '',
    });
    setShowModal(true);
  };

  // Salvar feedback
  const handleSaveFeedback = async () => {
    if (!formData.matricula) {
      toast.error('Selecione um colaborador');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('feedbacks')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Feedback atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('feedbacks').insert([formData]);
        if (error) throw error;
        toast.success('Feedback criado com sucesso!');
      }

      setShowModal(false);
      const { data } = await supabase.from('feedbacks').select('*').order('data_feedback', { ascending: false });
      setFeedbacks(data || []);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      toast.error('Erro ao salvar feedback');
    }
  };

  // Deletar feedback
  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este feedback?')) {
      try {
        const { error } = await supabase.from('feedbacks').delete().eq('id', id);
        if (error) throw error;
        toast.success('Feedback deletado com sucesso!');
        setFeedbacks(feedbacks.filter((f) => f.id !== id));
      } catch (err) {
        console.error('Erro ao deletar:', err);
        toast.error('Erro ao deletar feedback');
      }
    }
  };

  // Exportar CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'matricula',
        'data_feedback',
        'tipo_feedback',
        'assunto',
        'descricao',
        'pontos_positivos',
        'pontos_melhorar',
        'proximas_acoes',
        'responsavel_feedback',
        'status',
        'data_proxima_revisao',
        'observacoes',
      ];

      const rows = filteredFeedbacks.map((f) => [
        f.matricula,
        f.data_feedback || '',
        f.tipo_feedback || '',
        f.assunto || '',
        f.descricao || '',
        f.pontos_positivos || '',
        f.pontos_melhorar || '',
        f.proximas_acoes || '',
        f.responsavel_feedback || '',
        f.status || '',
        f.data_proxima_revisao || '',
        f.observacoes || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedbacks_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Arquivo exportado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar arquivo');
    }
  };

  // Converter data DD/MM/AAAA para YYYY-MM-DD
  const convertDateFormat = (dateStr: string): string => {
    if (!dateStr || dateStr.includes('-')) return dateStr;
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return dateStr;

    const dia = String(match[1]).padStart(2, '0');
    const mes = String(match[2]).padStart(2, '0');
    const ano = match[3];

    return `${ano}-${mes}-${dia}`;
  };

  // Formatar data local na tabela
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

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));

      const matriculaIndex = headers.indexOf('matricula');
      const dataFeedbackIndex = headers.indexOf('data_feedback');
      const tipoFeedbackIndex = headers.indexOf('tipo_feedback');
      const assuntoIndex = headers.indexOf('assunto');
      const descricaoIndex = headers.indexOf('descricao');
      const pontosPositivosIndex = headers.indexOf('pontos_positivos');
      const pontosMelhorarIndex = headers.indexOf('pontos_melhorar');
      const proximasAcoesIndex = headers.indexOf('proximas_acoes');
      const responsavelIndex = headers.indexOf('responsavel_feedback');
      const statusIndex = headers.indexOf('status');
      const dataProximaRevisaoIndex = headers.indexOf('data_proxima_revisao');
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

        const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
        const matricula = values[matriculaIndex];

        if (!matricula) {
          errorCount++;
          continue;
        }

        const newFeedback: any = {
          matricula,
          data_feedback: dataFeedbackIndex !== -1 ? convertDateFormat(values[dataFeedbackIndex]) || null : null,
          tipo_feedback: tipoFeedbackIndex !== -1 ? values[tipoFeedbackIndex] || null : null,
          assunto: assuntoIndex !== -1 ? values[assuntoIndex] || null : null,
          descricao: descricaoIndex !== -1 ? values[descricaoIndex] || null : null,
          pontos_positivos: pontosPositivosIndex !== -1 ? values[pontosPositivosIndex] || null : null,
          pontos_melhorar: pontosMelhorarIndex !== -1 ? values[pontosMelhorarIndex] || null : null,
          proximas_acoes: proximasAcoesIndex !== -1 ? values[proximasAcoesIndex] || null : null,
          responsavel_feedback: responsavelIndex !== -1 ? values[responsavelIndex] || null : null,
          status: statusIndex !== -1 ? values[statusIndex] || null : null,
          data_proxima_revisao: dataProximaRevisaoIndex !== -1 ? convertDateFormat(values[dataProximaRevisaoIndex]) || null : null,
          observacoes: observacoesIndex !== -1 ? values[observacoesIndex] || null : null,
        };

        const { error } = await supabase.from('feedbacks').insert([newFeedback]);
        if (error) {
          errorCount++;
          console.error('Erro ao inserir:', error);
        } else {
          successCount++;
        }
      }

      toast.success(`${successCount} feedbacks importados com sucesso!`);
      if (errorCount > 0) toast.error(`${errorCount} feedbacks falharam na importação`);

      const { data } = await supabase.from('feedbacks').select('*').order('data_feedback', { ascending: false });
      setFeedbacks(data || []);
    } catch (err) {
      console.error('Erro ao importar:', err);
      toast.error('Erro ao importar arquivo');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Layout currentPage="feedbacks">
      {/* Header com Pesquisa e Botão Novo */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        {/* Pesquisa */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por matrícula, nome, assunto ou tipo..."
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
            <span>Novo Feedback</span>
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

      {/* Tabela de Feedbacks */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Carregando feedbacks...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">
              {feedbacks.length === 0 ? 'Nenhum feedback cadastrado' : 'Nenhum resultado encontrado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Matrícula</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assunto</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.map((feedback, idx) => {
                  const colaborador = colaboradores.find((c) => c.matricula === feedback.matricula);
                  return (
                    <tr key={feedback.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-700">{feedback.matricula}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{colaborador?.nome || '-'}</td>
                      
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatarDataLocal(feedback.data_feedback)}
                      </td>
                      
                      <td className="px-4 py-3 text-sm text-gray-700">{feedback.tipo_feedback || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{feedback.assunto || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            feedback.status === 'Aberto'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {feedback.status || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(feedback)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(feedback.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DICA DE IMPORTAÇÃO PARA FEEDBACKS */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Para importar feedbacks, prepare um arquivo CSV com as colunas:
          <code className="bg-white px-2 py-1 rounded ml-2 font-mono text-xs shadow-sm">
            matricula, data_feedback, tipo_feedback, assunto, descricao, pontos_positivos, pontos_melhorar, proximas_acoes, responsavel_feedback, status, data_proxima_revisao, observacoes
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
                {editingId ? 'Editar Feedback' : 'Novo Feedback'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador *</label>
                  <select
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.map((c) => (
                      <option key={c.matricula} value={c.matricula}>
                        {c.matricula} - {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data do Feedback</label>
                  <input
                    type="date"
                    value={formData.data_feedback}
                    onChange={(e) => setFormData({ ...formData, data_feedback: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.tipo_feedback}
                    onChange={(e) => setFormData({ ...formData, tipo_feedback: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Alinhamento</option>
                    <option>Revisao</option>
                    <option>Feedback Informal</option>
                    <option>Avaliacao Formal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Aberto</option>
                    <option>Fechado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                <input
                  type="text"
                  value={formData.assunto}
                  onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pontos Positivos</label>
                  <textarea
                    value={formData.pontos_positivos}
                    onChange={(e) => setFormData({ ...formData, pontos_positivos: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pontos a Melhorar</label>
                  <textarea
                    value={formData.pontos_melhorar}
                    onChange={(e) => setFormData({ ...formData, pontos_melhorar: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Próximas Ações</label>
                <textarea
                  value={formData.proximas_acoes}
                  onChange={(e) => setFormData({ ...formData, proximas_acoes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                  <input
                    type="text"
                    value={formData.responsavel_feedback}
                    onChange={(e) => setFormData({ ...formData, responsavel_feedback: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Próxima Revisão</label>
                  <input
                    type="date"
                    value={formData.data_proxima_revisao}
                    onChange={(e) => setFormData({ ...formData, data_proxima_revisao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFeedback}
                className="px-4 py-2 bg-[#2b3674] text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
