import React, { useState } from 'react';
import { Lock, Mail, User, Building2, ShieldCheck, LogIn, UserPlus, Key, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDept, setRegDept] = useState('Qualidade');
  const [regCargo, setRegCargo] = useState('Inspetor de Qualidade');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro no login');
      }
      toast.success(`Bem-vindo, ${data.user.nome}! (${data.user.departamento})`);
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao entrar no sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: regNome,
          email: regEmail,
          password: regPassword,
          departamento: regDept,
          cargo: regCargo
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro no cadastro');
      }
      toast.success('Usuário cadastrado com sucesso! Criptografia Bcrypt + JWT aplicada.');
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#18181a] border border-[var(--border)] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up relative">
        {/* Glow Top Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--color-kingstar-cyan)] via-[var(--color-kingstar-yellow)] to-[var(--color-kingstar-green)]"></div>

        {/* Modal Header */}
        <div className="p-5 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-kingstar-cyan)]/15 border border-[var(--color-kingstar-cyan)]/30 flex items-center justify-center text-[var(--color-kingstar-cyan)]">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                Autenticação & Segurança (JWT + Bcrypt)
              </h3>
              <p className="text-[11px] text-[#8b9dc3]">Acesso Operacional / Qualidade / Administrativo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b9dc3] hover:text-white transition-colors text-lg font-bold w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center"
            title="Fechar"
          >
            &times;
          </button>
        </div>

        {/* Tabs: Entrar vs Cadastrar */}
        <div className="flex border-b border-[var(--border)] bg-[#121214]">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
              tab === 'login'
                ? 'border-[var(--color-kingstar-cyan)] text-[var(--color-kingstar-cyan)] bg-[var(--color-kingstar-cyan)]/5'
                : 'border-transparent text-[#8b9dc3] hover:text-white'
            }`}
          >
            <LogIn size={15} />
            Entrar (Login)
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
              tab === 'register'
                ? 'border-[var(--color-kingstar-yellow)] text-[var(--color-kingstar-yellow)] bg-[var(--color-kingstar-yellow)]/5'
                : 'border-transparent text-[#8b9dc3] hover:text-white'
            }`}
          >
            <UserPlus size={15} />
            Cadastrar Novo Usuário
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1 flex items-center gap-1.5">
                  <Mail size={13} /> E-mail de Usuário
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Ex: qualidade@kingstar.com"
                  className="w-full bg-[#121214] border border-[var(--border)] rounded-md px-3.5 py-2.5 text-sm text-white focus:border-[var(--color-kingstar-cyan)] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1 flex items-center gap-1.5">
                  <Lock size={13} /> Senha de Acesso
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="******"
                  className="w-full bg-[#121214] border border-[var(--border)] rounded-md px-3.5 py-2.5 text-sm text-white focus:border-[var(--color-kingstar-cyan)] outline-none transition-colors"
                />
              </div>

              {/* Quick test buttons for 3 roles */}
              <div className="pt-1">
                <span className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-2">
                  ⚡ Login Rápido por Departamento (Clique para Testar):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('qualidade@kingstar.com', 'qualidade123')}
                    className="py-1.5 px-2 bg-[var(--color-kingstar-yellow)]/10 border border-[var(--color-kingstar-yellow)]/30 text-[var(--color-kingstar-yellow)] hover:bg-[var(--color-kingstar-yellow)]/20 text-[10px] font-bold rounded-md transition-colors"
                  >
                    QA Qualidade
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('operacional@kingstar.com', 'operacional123')}
                    className="py-1.5 px-2 bg-[var(--color-kingstar-cyan)]/10 border border-[var(--color-kingstar-cyan)]/30 text-[var(--color-kingstar-cyan)] hover:bg-[var(--color-kingstar-cyan)]/20 text-[10px] font-bold rounded-md transition-colors"
                  >
                    Operacional
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@kingstar.com', 'admin123')}
                    className="py-1.5 px-2 bg-[var(--color-kingstar-green)]/10 border border-[var(--color-kingstar-green)]/30 text-[var(--color-kingstar-green)] hover:bg-[var(--color-kingstar-green)]/20 text-[10px] font-bold rounded-md transition-colors"
                  >
                    Administrativo
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--color-kingstar-cyan)] text-black font-extrabold text-xs uppercase tracking-wider rounded-md hover:opacity-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.25)] flex items-center justify-center gap-2"
                >
                  {loading ? 'Autenticando...' : 'Entrar no Sistema (JWT)'}
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1 flex items-center gap-1.5">
                  <User size={13} /> Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={regNome}
                  onChange={(e) => setRegNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-[#121214] border border-[var(--border)] rounded-md px-3.5 py-2 text-sm text-white focus:border-[var(--color-kingstar-yellow)] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1 flex items-center gap-1.5">
                  <Mail size={13} /> E-mail de Trabalho *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Ex: joao.qa@kingstar.com"
                  className="w-full bg-[#121214] border border-[var(--border)] rounded-md px-3.5 py-2 text-sm text-white focus:border-[var(--color-kingstar-yellow)] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1 flex items-center gap-1.5">
                  <Lock size={13} /> Senha *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#121214] border border-[var(--border)] rounded-md px-3.5 py-2 text-sm text-white focus:border-[var(--color-kingstar-yellow)] outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1 flex items-center gap-1.5">
                    <Building2 size={13} /> Departamento *
                  </label>
                  <select
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    className="w-full bg-[#121214] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-yellow)] outline-none transition-colors cursor-pointer"
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
                    value={regCargo}
                    onChange={(e) => setRegCargo(e.target.value)}
                    placeholder="Ex: Almoxarife"
                    className="w-full bg-[#121214] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-yellow)] outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[var(--color-kingstar-yellow)] text-black font-extrabold text-xs uppercase tracking-wider rounded-md hover:opacity-95 transition-all shadow-[0_0_20px_rgba(250,204,21,0.25)] flex items-center justify-center gap-2"
                >
                  {loading ? 'Cadastrando...' : 'Criar Conta e Entrar (Bcrypt + JWT)'}
                  <Sparkles size={15} />
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-[var(--border)] text-center">
            <span className="text-[11px] text-[#5a6a7a] flex items-center justify-center gap-1.5">
              <Key size={12} className="text-[var(--color-kingstar-green)]" />
              Tabelas em Banco MySQL / SQLite & Criptografia de Senha Bcrypt ativa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
