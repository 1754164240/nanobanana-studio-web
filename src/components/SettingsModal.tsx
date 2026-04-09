'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Key, Info, Loader2, Eye, EyeOff, ExternalLink, PencilLine } from 'lucide-react';
import { apiUrl, assetUrl } from '@/lib/basePath';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyChange?: (hasKey: boolean) => void;
}

type Tab = 'api' | 'about';

export function SettingsModal({ isOpen, onClose, onApiKeyChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('api');

  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [masked, setMasked] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkKey();
    }
  }, [isOpen]);

  const checkKey = async () => {
    try {
      const res = await fetch(apiUrl('/api/config'));
      const data = await res.json();
      setHasKey(data.hasKey);
      setMasked(data.masked);
      setBaseUrl(data.baseUrl || '');
      setModel(data.model || '');
    } catch {
      setError('检查 API 密钥状态失败');
    } finally {
      setLoading(false);
    }
  };

  const saveKey = async () => {
    if (!apiKey.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiKey: apiKey.trim() || undefined, 
          baseUrl: baseUrl.trim() || '',
          model: model.trim() || ''
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '保存 API 密钥失败');
        return;
      }

      setHasKey(true);
      setMasked(apiKey.slice(0, 4) + '...' + apiKey.slice(-4));
      setApiKey('');
      setEditing(false);
      onApiKeyChange?.(true);
    } catch {
      setError('保存 API 密钥失败');
    } finally {
      setSaving(false);
    }
  };

  const removeKey = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/config'), { method: 'DELETE' });

      if (!res.ok) {
        setError('删除 API 密钥失败');
        return;
      }

      setHasKey(false);
      setMasked(null);
      setBaseUrl('');
      setModel('');
      setEditing(false);
      onApiKeyChange?.(false);
    } catch {
      setError('Failed to remove API key');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-card border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'api'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Key className="w-4 h-4" />
            API 密钥
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'about'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Info className="w-4 h-4" />
            关于
          </button>

        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'api' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在检查 API 密钥...</span>
                </div>
              ) : hasKey && !editing ? (
                <div className="flex items-center gap-3">
                  <code className="px-4 py-1.5 bg-muted rounded text-sm font-mono">
                    <span className="text-muted-foreground">GEMINI_API_KEY=</span>{masked}
                  </code>
                  {baseUrl && (
                    <code className="px-4 py-1.5 bg-muted rounded text-sm font-mono truncate max-w-[200px]" title={baseUrl}>
                      <span className="text-muted-foreground">URL=</span>{baseUrl}
                    </code>
                  )}
                  {model && (
                    <code className="px-4 py-1.5 bg-muted rounded text-sm font-mono truncate max-w-[200px]" title={model}>
                      <span className="text-muted-foreground">模型=</span>{model}
                    </code>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => setEditing(true)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Change API key"
                    >
                      <PencilLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={removeKey}
                      disabled={saving}
                      className="p-2 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove API key"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setError(null);
                        }}
                        placeholder="输入您的 Gemini API 密钥"
                        autoComplete="off"
                        className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => {
                          setBaseUrl(e.target.value);
                          setError(null);
                        }}
                        placeholder="自定义 Base URL（可选，代理地址）"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => {
                          setModel(e.target.value);
                          setError(null);
                        }}
                        placeholder="自定义模型（可选）"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                    <button
                      onClick={saveKey}
                      disabled={saving}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存'}
                    </button>
                    {editing && (
                      <button
                        onClick={() => {
                          setEditing(false);
                          setApiKey('');
                          setError(null);
                        }}
                        className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {error && <p className="text-sm text-error">{error}</p>}
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  在上方输入您的 API 密钥，或在 Shell 环境中设置 <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">GEMINI_API_KEY</code>。
                </p>
                <p>
                  从{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Google AI Studio 获取密钥
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">

              <div className="space-y-3 text-sm">
                <p>
                  轻量级、自托管的 Google Gemini 3 (Nano Banana) 图像生成客户端。
                  BYOK（自带密钥）- 您的 API 密钥始终保存在本地。
                </p>

                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <p className="font-medium">功能特性：</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>文生图：根据提示词生成图像</li>
                    <li>图生图：转换现有图像</li>
                    <li>1K、2K 和 4K 输出分辨率</li>
                    <li>多种宽高比</li>
                  </ul>
                  <p className="font-medium">API 和 模型：</p>
                  <p className="text-muted-foreground">
                    Gemini 3.1 Flash Image (<code className="text-xs bg-background px-1 py-0.5 rounded">gemini-3.1-flash-image</code>)
                  </p>
                  <p className="text-muted-foreground">
                    直接调用同步推理 API，快速生成结果。
                  </p>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="font-medium">文档：</p>
                  <div className="flex flex-col gap-1">
                    <a
                      href="https://ai.google.dev/gemini-api/docs/image-generation"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      图像生成指南
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://ai.google.dev/gemini-api/docs/pricing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      价格详情
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                <p>使用 Next.js、Tailwind CSS 和 SQLite 构建</p>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
