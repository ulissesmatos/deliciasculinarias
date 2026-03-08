import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { useToast } from '@/hooks/use-toast';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({ oldPassword: '', password: '', passwordConfirm: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.oldPassword) e.oldPassword = 'Senha atual obrigatória.';
    if (!form.password) e.password = 'Nova senha obrigatória.';
    else if (form.password.length < 8) e.password = 'A senha deve ter pelo menos 8 caracteres.';
    if (form.password !== form.passwordConfirm) e.passwordConfirm = 'As senhas não coincidem.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await pb.collection('users').update(user.id, {
        oldPassword: form.oldPassword,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
      });
      toast({ title: 'Senha alterada com sucesso!' });
      setForm({ oldPassword: '', password: '', passwordConfirm: '' });
    } catch (err) {
      const msg = err?.response?.message || err?.message || '';
      if (msg.toLowerCase().includes('old') || msg.toLowerCase().includes('invalid')) {
        setErrors({ oldPassword: 'Senha atual incorreta.' });
      } else {
        toast({ title: 'Erro ao alterar senha. Tente novamente.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, label, value, showKey, placeholder }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show[showKey] ? 'text' : 'password'}
          value={value}
          onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
          placeholder={placeholder}
          autoComplete={id === 'oldPassword' ? 'current-password' : 'new-password'}
          className={`w-full pr-10 pl-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            errors[id] ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {errors[id] && <p className="mt-1 text-xs text-red-500">{errors[id]}</p>}
    </div>
  );

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          title="Voltar"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Password card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5 text-gray-800">
          <KeyRound size={18} />
          <h2 className="font-semibold">Alterar senha</h2>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field
            id="oldPassword"
            label="Senha atual"
            value={form.oldPassword}
            showKey="old"
            placeholder="••••••••"
          />
          <Field
            id="password"
            label="Nova senha"
            value={form.password}
            showKey="new"
            placeholder="Mínimo 8 caracteres"
          />
          <Field
            id="passwordConfirm"
            label="Confirmar nova senha"
            value={form.passwordConfirm}
            showKey="confirm"
            placeholder="Repita a nova senha"
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              <Save size={16} />
              {loading ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
