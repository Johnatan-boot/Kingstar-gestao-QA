import React, { useState, useEffect } from 'react';
import { Users, Shield, Lock, UserPlus, Building2, Key, CheckCircle2, Trash2, Edit2, Plus, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserItem {
  id: number;
  nome: string;
  email: string;
  departamento: string;
  cargo: string;
  status: string;
  created_at: string;
}

interface DeptItem {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  responsavel: string;
  status: string;
  created_at?: string;
}

interface UsersAndDeptsViewProps {
  currentUser: any;
  onUserUpdate: () => void;
}

export function UsersAndDeptsView({ currentUser, onUserUpdate }: UsersAndDeptsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'usuarios' | 'departamentos'>('usuarios');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departamentos, setDepartamentos] = useState<DeptItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    password: '',
    departamento: 'Qualidade',
    cargo: 'Analista de Qualidade'
  });

  // New Dept Form State
  const [isNewDeptOpen, setIsNewDeptOpen] = useState(false);
  const [newDept, setNewDept] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    responsavel: ''
  });

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/departamentos')
      ]);
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(Array.isArray(uData) ? uData : []);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDepartamentos(Array.isArray(dData) ? dData : []);
      }
    } catch (e) {
      console.error('Erro ao buscar usuários e departamentos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar usuário');
      }
      toast.success('Usuário criado com criptografia Bcrypt + JWT!');
      setIsNewUserOpen(false);
      setNewUser({
        nome: '',
        email: '',
        password: '',
        departamento: 'Qualidade',
        cargo: 'Analista de Qualidade'
      });
      fetchAllData();
      onUserUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário');
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/departamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDept)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar departamento');
      }
      toast.success('Departamento cadastrado no banco de dados!');
      setIsNewDeptOpen(false);
      setNewDept({ codigo: '', nome: '', descricao: '', responsavel: '' });
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar departamento');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Deseja realmente remover este usuário do sistema?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover usuário');
      toast.success('Usuário removido!');
      fetchAllData();
    } catch (e: any) {
      toast.error(e.message || 'Não foi possível remover');
    }
  };

  const handleDeleteDept = async (id: number) => {
    if (!confirm('Deseja realmente remover este departamento?')) return;
    try {
      const res = await fetch(`/api/departamentos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover departamento');
      toast.success('Departamento removido!');
      fetchAllData();
    } catch (e: any) {
      toast.error('Erro ao remover departamento');
    }
  };

  const handleChangeDeptUser = async (userId: number, newDept: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/departamento`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departamento: newDept, status: 'Ativo' })
      });
      if (res.ok) {
        toast.success(`Departamento alterado para ${newDept}`);
        fetchAllData();
        onUserUpdate();
      }
    } catch (e) {
      toast.error('Erro ao atualizar departamento');
    }
  };

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'Qualidade':
        return 'bg-[var(--color-kingstar-yellow)]/15 border-[var(--color-kingstar-yellow)]/40 text-[var(--color-kingstar-yellow)]';
      case 'Operacional':
        return 'bg-[var(--color-kingstar-cyan)]/15 border-[var(--color-kingstar-cyan)]/40 text-[var(--color-kingstar-cyan)]';
      case 'Administrativo':
        return 'bg-[var(--color-kingstar-green)]/15 border-[var(--color-kingstar-green)]/40 text-[var(--color-kingstar-green)]';
      default:
        return 'bg-white/10 border-white/20 text-white';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-lg border border-[var(--border)] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[var(--color-kingstar-cyan)]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="text-[var(--color-kingstar-cyan)]" size={22} />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Gestão de Segurança, Usuários & Departamentos
              </h2>
            </div>
            <p className="text-sm text-[#8b9dc3]">
              Tabelas em MySQL & SQLite com Criptografia Bcrypt (Senhas Hashed), Autenticação JWT e Perfis Operacionais/Qualidade/Administrativo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSubTab('usuarios')}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition-all flex items-center gap-2 border ${
                activeSubTab === 'usuarios'
                  ? 'bg-[var(--color-kingstar-cyan)] text-black border-[var(--color-kingstar-cyan)] shadow-md'
                  : 'bg-[#121212] text-[#8b9dc3] border-[var(--border)] hover:text-white'
              }`}
            >
              <Users size={15} />
              Tabela de Usuários ({users.length})
            </button>
            <button
              onClick={() => setActiveSubTab('departamentos')}
              className={`px-4 py-2 rounded-sm text-xs font-bold transition-all flex items-center gap-2 border ${
                activeSubTab === 'departamentos'
                  ? 'bg-[var(--color-kingstar-cyan)] text-black border-[var(--color-kingstar-cyan)] shadow-md'
                  : 'bg-[#121212] text-[#8b9dc3] border-[var(--border)] hover:text-white'
              }`}
            >
              <Building2 size={15} />
              Tabela de Departamentos ({departamentos.length})
            </button>
          </div>
        </div>
      </div>

      {/* Security Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-lg border border-[var(--border)] flex items-center gap-3">
          <div className="p-3 bg-[var(--color-kingstar-yellow)]/10 text-[var(--color-kingstar-yellow)] rounded-lg">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8b9dc3]">Departamento Qualidade (QA)</div>
            <div className="text-sm font-semibold text-white">Inspetores & Auditores CAPA</div>
            <div className="text-xs text-[#5a6a7a]">Acesso a Laudos, Quarentena e Inspeções</div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-lg border border-[var(--border)] flex items-center gap-3">
          <div className="p-3 bg-[var(--color-kingstar-cyan)]/10 text-[var(--color-kingstar-cyan)] rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8b9dc3]">Departamento Operacional</div>
            <div className="text-sm font-semibold text-white">Almoxarifado & Logística</div>
            <div className="text-xs text-[#5a6a7a]">Entradas, Saídas e Controle de Peças</div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-lg border border-[var(--border)] flex items-center gap-3">
          <div className="p-3 bg-[var(--color-kingstar-green)]/10 text-[var(--color-kingstar-green)] rounded-lg">
            <Key size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#8b9dc3]">Segurança Ativa</div>
            <div className="text-sm font-semibold text-white">Bcrypt Hash + JWT Token</div>
            <div className="text-xs text-[#5a6a7a]">Senhas criptografadas no banco</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'usuarios' ? (
        <div className="glass-panel rounded-lg border border-[var(--border)] overflow-hidden">
          <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[var(--color-kingstar-cyan)]" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                Tabela de Usuários no Banco de Dados
              </h3>
            </div>
            <button
              onClick={() => setIsNewUserOpen(true)}
              className="px-3 py-1.5 bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              NOVO USUÁRIO
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-widest font-semibold bg-[#121212]">
                  <th className="p-4">ID</th>
                  <th className="p-4">Nome</th>
                  <th className="p-4">E-mail (Login)</th>
                  <th className="p-4">Departamento</th>
                  <th className="p-4">Cargo / Função</th>
                  <th className="p-4">Criptografia</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#8b9dc3]">Carregando usuários...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#8b9dc3]">Nenhum usuário cadastrado.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-xs text-[#5a6a7a]">#{u.id}</td>
                      <td className="p-4 font-medium text-white flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[var(--color-kingstar-cyan)]/20 text-[var(--color-kingstar-cyan)] font-bold flex items-center justify-center text-xs">
                          {u.nome.charAt(0)}
                        </span>
                        {u.nome}
                      </td>
                      <td className="p-4 text-[#8b9dc3] font-mono text-xs">{u.email}</td>
                      <td className="p-4">
                        <select
                          value={u.departamento}
                          onChange={(e) => handleChangeDeptUser(u.id, e.target.value)}
                          className={`text-xs px-2.5 py-1 rounded-full font-bold border cursor-pointer outline-none ${getDeptColor(u.departamento)}`}
                        >
                          <option value="Qualidade" className="bg-[#1e1e1e] text-yellow-400">Qualidade (QA)</option>
                          <option value="Operacional" className="bg-[#1e1e1e] text-cyan-400">Operacional</option>
                          <option value="Administrativo" className="bg-[#1e1e1e] text-green-400">Administrativo</option>
                        </select>
                      </td>
                      <td className="p-4 text-[#8b9dc3]">{u.cargo || 'Colaborador'}</td>
                      <td className="p-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 font-mono">
                          Bcrypt Hashed
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-kingstar-green)]/15 border border-[var(--color-kingstar-green)]/30 text-[var(--color-kingstar-green)] font-bold uppercase">
                          {u.status || 'Ativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.id !== 1 && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-[#8b9dc3] hover:text-[var(--color-kingstar-red)] transition-colors p-1"
                            title="Remover Usuário"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-lg border border-[var(--border)] overflow-hidden">
          <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[var(--color-kingstar-cyan)]" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                Tabela de Departamentos no Banco de Dados
              </h3>
            </div>
            <button
              onClick={() => setIsNewDeptOpen(true)}
              className="px-3 py-1.5 bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold rounded-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Plus size={14} />
              NOVO DEPARTAMENTO
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-widest font-semibold bg-[#121212]">
                  <th className="p-4">ID</th>
                  <th className="p-4">Código</th>
                  <th className="p-4">Nome do Departamento</th>
                  <th className="p-4">Descrição & Atribuições</th>
                  <th className="p-4">Responsável</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {departamentos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#8b9dc3]">Nenhum departamento encontrado.</td>
                  </tr>
                ) : (
                  departamentos.map((d) => (
                    <tr key={d.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-xs text-[#5a6a7a]">#{d.id}</td>
                      <td className="p-4 font-mono text-xs text-[var(--color-kingstar-cyan)] font-bold">{d.codigo}</td>
                      <td className="p-4 font-bold text-white">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border mr-2 ${getDeptColor(d.nome)}`}>
                          {d.nome}
                        </span>
                      </td>
                      <td className="p-4 text-[#8b9dc3] max-w-md truncate">{d.descricao}</td>
                      <td className="p-4 text-[#8b9dc3] font-medium">{d.responsavel || '-'}</td>
                      <td className="p-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-kingstar-green)]/15 border border-[var(--color-kingstar-green)]/30 text-[var(--color-kingstar-green)] font-bold uppercase">
                          {d.status || 'Ativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteDept(d.id)}
                          className="text-[#8b9dc3] hover:text-[var(--color-kingstar-red)] transition-colors p-1"
                          title="Remover Departamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal - NOVO USUÁRIO */}
      {isNewUserOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-[var(--border)] rounded-lg w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                <UserPlus size={16} className="text-[var(--color-kingstar-cyan)]" />
                Cadastrar Novo Usuário (com Bcrypt + JWT)
              </h3>
              <button
                onClick={() => setIsNewUserOpen(false)}
                className="text-[#8b9dc3] hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newUser.nome}
                  onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                  placeholder="Ex: Carlos Oliveira"
                  className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">
                  E-mail de Acesso (Login) *
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Ex: carlos.qa@kingstar.com"
                  className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">
                  Senha (será convertida em Bcrypt Hash) *
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="********"
                  className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">
                    Departamento *
                  </label>
                  <select
                    value={newUser.departamento}
                    onChange={(e) => setNewUser({ ...newUser, departamento: e.target.value })}
                    className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors"
                  >
                    <option value="Qualidade">Qualidade (QA)</option>
                    <option value="Operacional">Operacional</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={newUser.cargo}
                    onChange={(e) => setNewUser({ ...newUser, cargo: e.target.value })}
                    placeholder="Ex: Analista CAPA"
                    className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewUserOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--color-kingstar-cyan)] text-black font-bold text-xs rounded-sm hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  CADASTRAR E SALVAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - NOVO DEPARTAMENTO */}
      {isNewDeptOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-[var(--border)] rounded-lg w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                <Building2 size={16} className="text-[var(--color-kingstar-cyan)]" />
                Cadastrar Novo Departamento no Banco
              </h3>
              <button
                onClick={() => setIsNewDeptOpen(false)}
                className="text-[#8b9dc3] hover:text-white transition-colors"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateDept} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">
                    Código do Depto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDept.codigo}
                    onChange={(e) => setNewDept({ ...newDept, codigo: e.target.value })}
                    placeholder="Ex: ENG-04"
                    className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white uppercase focus:border-[var(--color-kingstar-cyan)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDept.nome}
                    onChange={(e) => setNewDept({ ...newDept, nome: e.target.value })}
                    placeholder="Ex: Engenharia"
                    className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">
                  Responsável / Gestor
                </label>
                <input
                  type="text"
                  value={newDept.responsavel}
                  onChange={(e) => setNewDept({ ...newDept, responsavel: e.target.value })}
                  placeholder="Ex: Eng. Roberto"
                  className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">
                  Descrição & Escopo do Departamento
                </label>
                <textarea
                  rows={3}
                  value={newDept.descricao}
                  onChange={(e) => setNewDept({ ...newDept, descricao: e.target.value })}
                  placeholder="Ex: Departamento responsável pelos projetos e ferramentaria..."
                  className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewDeptOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--color-kingstar-cyan)] text-black font-bold text-xs rounded-sm hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  SALVAR DEPARTAMENTO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
