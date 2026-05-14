import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useColaborador } from '@/contexts/ColaboradorContext';
import { Upload, Download, Search, Trash2, Edit2, Plus, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

type SortKey = 'matricula' | 'nome' | 'cargo' | 'departamento' | 'status' | 'data_admissao' | 'tempo_empresa' | 'email' | 'telefone';

export default function Efetivo() {
  const { colaboradores, loading, addColaborador, deleteColaborador, updateColaborador } = useColaborador();
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMatricula, setEditingMatricula] = useState<string | null>(null);
  
  // Estado de Ordenação
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  const [formData, setFormData] = useState({
    matricula: '',
    nome: '',
    cargo: '',
    departamento: '',
    status: 'Ativo',
    data_admissao: '',
    email: '',
    telefone: '',
  });

  // Função para mudar a ordenação ao clicar no cabeçalho
  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Ícone de ordenação do cabeçalho
  const renderSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) return <ArrowUpDown size={14} className="text-gray-400 ml-1 inline" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={16} className="text-[#2b3674] ml-1 inline font-bold" /> 
      : <ChevronDown size={16} className="text-[#2b3674] ml-1 inline font-bold" />;
  };

  // Filtrar e Ordenar colaboradores
  const processedColaboradores = useMemo(() => {
    // 1. Filtrar
    let filtered = colaboradores.filter((col) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (col.matricula?.toLowerCase().includes(searchLower) || false) ||
        (col.nome?.toLowerCase().includes(searchLower) || false) ||
        (col.cargo?.toLowerCase().includes(searchLower) || false) ||
        (col.departamento?.toLowerCase().includes(searchLower) || false)
      );
    });

    // 2. Ordenar
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof typeof a];
        let bValue = b[sortConfig.key as keyof typeof b];

        // Lógica especial para Tempo de Empresa (baseada na data de admissão invertida)
        if (sortConfig.key === 'tempo_empresa') {
          aValue = a.data_admissao as any;
          bValue = b.data_admissao as any;
          if (!aValue) return 1;
          if (!bValue) return -1;
          // Ascendente = Menos tempo (Data mais recente/maior)
          // Descendente = Mais tempo (Data mais antiga/menor)
          return sortConfig.direction === 'asc'
            ? (aValue > bValue ? -1 : 1)
            : (aValue < bValue ? -1 : 1);
        }

        // Para strings e outros campos normais
        if (!aValue) return 1; // Joga os nulos para o final
        if (!bValue) return -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [colaboradores, searchTerm, sortConfig]);

  // Abrir modal para novo colaborador
  const handleOpenNewModal = () => {
    setEditingMatricula(null);
    setFormData({
      matricula: '',
      nome: '',
      cargo: '',
      departamento: '',
      status: 'Ativo',
      data_admissao: '',
      email: '',
      telefone: '',
    });
    setShowModal(true);
  };

  // Abrir modal para editar colaborador
  const handleOpenEditModal = (colaborador: typeof colaboradores[0]) => {
    setEditingMatricula(colaborador.matricula);
    setFormData({
      matricula: colaborador.matricula,
      nome: colaborador.nome || '',
      cargo: colaborador.cargo || '',
      departamento: colaborador.departamento || '',
      status: colaborador.status || 'Ativo',
      data_admissao: colaborador.data_admissao || '',
      email: colaborador.email || '',
      telefone: colaborador.telefone || '',
    });
    setShowModal(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMatricula(null);
    setFormData({
      matricula: '',
      nome: '',
      cargo: '',
      departamento: '',
      status: 'Ativo',
      data_admissao: '',
      email: '',
      telefone: '',
    });
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.matricula) {
      toast.error('Matrícula é obrigatória');
      return;
    }

    try {
      if (editingMatricula) {
        // Atualizar colaborador existente
        await updateColaborador(editingMatricula, {
          nome: formData.nome || null,
          cargo: formData.cargo || null,
          departamento: formData.departamento || null,
          status: formData.status,
          data_admissao: formData.data_admissao || null,
          email: formData.email || null,
          telefone: formData.telefone || null,
        });
        toast.success('Colaborador atualizado com sucesso!');
      } else {
        // Adicionar novo colaborador
        await addColaborador({
          matricula: formData.matricula,
          nome: formData.nome || null,
          cargo: formData.cargo || null,
          departamento: formData.departamento || null,
          status: formData.status,
          data_admissao: formData.data_admissao || null,
          email: formData.email || null,
          telefone: formData.telefone || null,
        });
        toast.success('Colaborador adicionado com sucesso!');
      }

      handleCloseModal();
    } catch (err) {
      toast.error('Erro ao salvar colaborador');
    }
  };

  // Exportar CSV
  const handleExportCSV = () => {
    try {
      const headers = ['matricula', 'nome', 'cargo', 'departamento', 'status', 'data_admissao', 'email', 'telefone'];
      const rows = processedColaboradores.map((col) => [
        col.matricula,
        col.nome || '',
        col.cargo || '',
        col.departamento || '',
        col.status || '',
        col.data_admissao || '',
        col.email || '',
        col.telefone || '',
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `colaboradores_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Arquivo exportado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar:', err);
      toast.error('Erro ao exportar arquivo');
    }
  };

  // Deletar colaborador
  const handleDeleteColaborador = async (matricula: string) => {
    if (confirm('Tem certeza que deseja deletar este colaborador?')) {
      try {
        await deleteColaborador(matricula);
        toast.success('Colaborador deletado com sucesso!');
      } catch (err) {
        toast.error('Erro ao deletar colaborador');
      }
    }
  };

  // Função para converter data DD/MM/AAAA para YYYY-MM-DD
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

  // Função para processar CSV
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const lines = text.split('\n');

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const matriculaIndex = headers.indexOf('matricula');
      const nomeIndex = headers.indexOf('nome');
      const cargoIndex = headers.indexOf('cargo');
      const departamentoIndex = headers.indexOf('departamento');
      const statusIndex = headers.indexOf('status');
      const dataAdmissaoIndex = headers.indexOf('data_admissao');
      const emailIndex = headers.indexOf('email');
      const telefoneIndex = headers.indexOf('telefone');

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
          const dataAdmissaoRaw = values[dataAdmissaoIndex];
          const dataAdmissao = dataAdmissaoRaw ? converterDataBrasileira(dataAdmissaoRaw) : null;

          const novoColaborador = {
            matricula,
            nome: values[nomeIndex] || null,
            cargo: values[cargoIndex] || null,
            departamento: values[departamentoIndex] || null,
            status: values[statusIndex] || null,
            data_admissao: dataAdmissao,
            email: values[emailIndex] || null,
            telefone: values[telefoneIndex] || null,
          };

          await addColaborador(novoColaborador);
          successCount++;
        } catch (err) {
          console.error(`Erro ao adicionar linha ${i}:`, err);
          errorCount++;
        }
      }

      toast.success(`${successCount} colaborador(es) importado(s) com sucesso!`);
      if (errorCount > 0) {
        toast.warning(`${errorCount} linha(s) falharam na importação`);
      }
    } catch (err) {
      console.error('Erro ao processar CSV:', err);
      toast.error('Erro ao processar arquivo CSV');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  // Função para calcular o tempo de empresa
  const calcularTempoEmpresa = (dataAdmissao: string | undefined | null) => {
    if (!dataAdmissao) return '-';
    
    const admissao = new Date(dataAdmissao);
    const hoje = new Date();
    
    let anos = hoje.getFullYear() - admissao.getFullYear();
    let meses = hoje.getMonth() - admissao.getMonth();

    if (meses < 0 || (meses === 0 && hoje.getDate() < admissao.getDate())) {
      anos--;
      meses += 12;
    }

    if (anos === 0 && meses === 0) return 'Menos de 1 mês';
    if (anos === 0) return `${meses} mês${meses > 1 ? 'es' : ''}`;
    if (meses === 0) return `${anos} ano${anos > 1 ? 's' : ''}`;
    
    return `${anos} ano${anos > 1 ? 's' : ''} e ${meses} mês${meses > 1 ? 'es' : ''}`;
  };

  return (
    <Layout currentPage="efetivo">
      {/* Header com Pesquisa, Importação e Botão Novo */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar por matrícula, nome, cargo ou departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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

      {/* Tabela de Colaboradores */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Carregando colaboradores...</p>
          </div>
        ) : processedColaboradores.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">
              {colaboradores.length === 0 ? 'Nenhum colaborador cadastrado' : 'Nenhum resultado encontrado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 select-none">
                <tr>
                  <th onClick={() => handleSort('matricula')} className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                    Matrícula {renderSortIcon('matricula')}
                  </th>
                  <th onClick={() => handleSort('nome')} className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                    Nome {renderSortIcon('nome')}
                  </th>
                  <th onClick={() => handleSort('cargo')} className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                    Cargo {renderSortIcon('cargo')}
                  </th>
                  <th onClick={() => handleSort('departamento')} className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                    Departamento {renderSortIcon('departamento')}
                  </th>
                  <th onClick={() => handleSort('status')} className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                    Status {renderSortIcon('status')}
                  </th>
                  <th onClick={() => handleSort('data_admissao')} className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                    Data Admissão {renderSortIcon('data_admissao')}
                  </th>
                  <th onClick={() => handleSort('tempo_empresa')} className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap">
                    Tempo de Empresa {renderSortIcon('tempo_empresa')}
                  </th>
                  <th onClick={() => handleSort('email')} className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                    Email {renderSortIcon('email')}
                  </th>
                  <th onClick={() => handleSort('telefone')} className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors">
                    Telefone {renderSortIcon('telefone')}
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedColaboradores.map((colaborador, index) => (
                  <tr
                    key={colaborador.matricula}
                    className={`border-b border-gray-200 hover:bg-gray-100 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-[#2b3674]">{colaborador.matricula}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{colaborador.nome || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{colaborador.cargo || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{colaborador.departamento || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          colaborador.status === 'Ativo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {colaborador.status || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {colaborador.data_admissao 
                        ? colaborador.data_admissao.split('-').reverse().join('/') 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium whitespace-nowrap">
                      {calcularTempoEmpresa(colaborador.data_admissao)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{colaborador.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{colaborador.telefone || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(colaborador)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteColaborador(colaborador.matricula)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Deletar"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Novo/Editar Colaborador */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#2b3674]">
                {editingMatricula ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Matrícula */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula *</label>
                <input
                  type="text"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  disabled={!!editingMatricula}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Ex: MAT001"
                />
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: João Silva"
                />
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Analista de Sistemas"
                />
              </div>

              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: TI"
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
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              {/* Data de Admissão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Admissão</label>
                <input
                  type="date"
                  value={formData.data_admissao}
                  onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: joao@empresa.com"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 11999999999"
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
                  {editingMatricula ? 'Atualizar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
