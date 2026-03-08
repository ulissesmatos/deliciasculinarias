import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ArrowLeft, Save, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Cpu, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  getAIConfig, saveAIConfig,
  OPENAI_MODELS, OPENROUTER_MODELS,
} from '@/lib/aiConfig.js';
import { testConnection } from '@/lib/aiService.js';

const AISettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [config, setConfig] = useState(getAIConfig);
  const [showKeys, setShowKeys] = useState({ openai: false, openrouter: false });
  const [testing, setTesting] = useState({ openai: false, openrouter: false });
  const [testResult, setTestResult] = useState({ openai: null, openrouter: null });

  // Update config helper
  const setProvider = (provider, field, value) => {
    setConfig(c => ({
      ...c,
      [provider]: { ...c[provider], [field]: value },
    }));
    // Clear test result when key/model changes
    setTestResult(r => ({ ...r, [provider]: null }));
  };

  const handleSave = () => {
    saveAIConfig(config);
    toast({ title: 'Configurações guardadas!', description: 'As definições de IA foram salvas com sucesso.' });
  };

  const handleTest = async (provider) => {
    const key = config[provider].apiKey;
    if (!key) {
      toast({ title: 'API Key vazia', description: `Insira a API key do ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'}.`, variant: 'destructive' });
      return;
    }

    setTesting(t => ({ ...t, [provider]: true }));
    setTestResult(r => ({ ...r, [provider]: null }));

    try {
      const result = await testConnection(provider, key, config[provider].model);
      setTestResult(r => ({ ...r, [provider]: result }));
    } catch (err) {
      setTestResult(r => ({ ...r, [provider]: { ok: false, message: err.message } }));
    } finally {
      setTesting(t => ({ ...t, [provider]: false }));
    }
  };

  const ProviderCard = ({ provider, title, models, icon: Icon }) => {
    const isActive = config.activeProvider === provider;
    const result = testResult[provider];

    return (
      <div className={`bg-white rounded-xl shadow-sm border-2 transition-colors ${
        isActive ? 'border-primary' : 'border-gray-100'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isActive ? 'bg-primary/10' : 'bg-gray-100'
              }`}>
                <Icon size={20} className={isActive ? 'text-primary' : 'text-gray-400'} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
                {isActive && (
                  <span className="text-xs text-primary font-medium">Provedor ativo</span>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setConfig(c => ({ ...c, activeProvider: provider }))}
            >
              {isActive ? '✓ Ativo' : 'Ativar'}
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* API Key */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">API Key</Label>
            <div className="mt-1.5 relative">
              <Input
                type={showKeys[provider] ? 'text' : 'password'}
                placeholder={provider === 'openai' ? 'sk-...' : 'sk-or-...'}
                value={config[provider].apiKey}
                onChange={e => setProvider(provider, 'apiKey', e.target.value)}
                className="pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKeys(s => ({ ...s, [provider]: !s[provider] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKeys[provider] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {provider === 'openai'
                ? 'Obtenha em platform.openai.com/api-keys'
                : 'Obtenha em openrouter.ai/keys'}
            </p>
          </div>

          {/* Model Selector */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Modelo</Label>
            <select
              className="mt-1.5 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              value={config[provider].model}
              onChange={e => setProvider(provider, 'model', e.target.value)}
            >
              {models.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label} — {m.description}
                </option>
              ))}
            </select>
          </div>

          {/* Custom model input */}
          <div>
            <Label className="text-xs text-gray-500">Ou insira um modelo customizado:</Label>
            <Input
              className="mt-1 text-sm font-mono"
              placeholder="ex: gpt-4-turbo-preview"
              value={
                models.some(m => m.value === config[provider].model)
                  ? ''
                  : config[provider].model
              }
              onChange={e => {
                if (e.target.value.trim()) {
                  setProvider(provider, 'model', e.target.value.trim());
                }
              }}
            />
          </div>

          {/* Test Connection */}
          <div>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleTest(provider)}
              disabled={testing[provider] || !config[provider].apiKey}
            >
              {testing[provider] ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  A testar…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Testar Conexão
                </>
              )}
            </Button>

            {result && (
              <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${
                result.ok
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {result.ok
                  ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-500" />
                  : <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                }
                <span>{result.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Configurações de IA - Admin</title>
      </Helmet>

      <div className="min-h-full bg-gray-50">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-none flex items-center gap-2">
                  <Cpu size={20} className="text-primary" />
                  Configurações de IA
                </h1>
                <span className="text-sm text-gray-500">OpenAI & OpenRouter</span>
              </div>
            </div>
            <Button
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Guardar Tudo
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
            <strong>Como funciona:</strong> Configure as API keys dos provedores de IA que deseja usar.
            Selecione o provedor ativo e o modelo preferido. Depois, use os botões de IA nos editores
            de receitas e artigos para gerar conteúdo ou traduzir automaticamente.
          </div>

          {/* Provider cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <ProviderCard
              provider="openai"
              title="OpenAI"
              models={OPENAI_MODELS}
              icon={Sparkles}
            />
            <ProviderCard
              provider="openrouter"
              title="OpenRouter"
              models={OPENROUTER_MODELS}
              icon={Cpu}
            />
          </div>

          {/* Security notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>🔒 Nota de segurança:</strong> As API keys são armazenadas localmente no seu navegador
            (localStorage). Elas nunca são enviadas para o nosso servidor — apenas para as APIs dos provedores
            de IA. Para máxima segurança, use keys com limites de gasto definidos no painel do provedor.
          </div>
        </div>
      </div>
    </>
  );
};

export default AISettingsPage;
