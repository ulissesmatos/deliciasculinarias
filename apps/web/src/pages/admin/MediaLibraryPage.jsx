import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Upload, Trash2, Copy, Check, Loader2, FolderOpen, Images,
  RefreshCw, X, Pencil, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import pb from '@/lib/pocketbaseClient.js';
import { convertToWebp } from '@/lib/convertToWebp.js';
import { useWebpConversion } from '@/hooks/useWebpConversion.js';

const FOLDERS = [
  { value: '',         label: 'Todas',    count: null },
  { value: 'blog',     label: 'Blog',     count: null },
  { value: 'receitas', label: 'Receitas', count: null },
  { value: 'geral',    label: 'Geral',    count: null },
];

const MediaLibraryPage = () => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState('');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({});

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('geral');
  const [convertWebp, setConvertWebp] = useWebpConversion();

  // Selected / edit state
  const [selected, setSelected] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editAlt, setEditAlt] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filter = folder ? pb.filter('folder = {:f}', { f: folder }) : undefined;
      const filterOpts = filter ? { filter } : {};
      const result = await pb.collection('media').getList(1, 500, {
        sort: '-created',
        ...filterOpts,
        requestKey: null,
      });
      setImages(result.items);

      // Update folder counts
      const allResult = await pb.collection('media').getList(1, 500, { requestKey: null });
      const c = {};
      allResult.items.forEach(r => {
        c[r.folder || ''] = (c[r.folder || ''] || 0) + 1;
      });
      c[''] = allResult.items.length;
      setCounts(c);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao carregar mídia', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => { load(); }, [load]);

  const getUrl = (record, size = '300x300') =>
    pb.files.getURL(record, record.file, { thumb: size });

  const getFullUrl = (record) =>
    pb.files.getURL(record, record.file);

  const handleFilesSelected = (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    setUploadQueue(imageFiles.map(f => ({ file: f, preview: URL.createObjectURL(f) })));
    setShowUploadPanel(true);
  };

  const handleUploadAll = async () => {
    if (uploadQueue.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const item of uploadQueue) {
      try {
        const file = convertWebp ? await convertToWebp(item.file) : item.file;
        const data = new FormData();
        data.append('file', file);
        data.append('folder', uploadFolder);
        await pb.collection('media').create(data, { requestKey: null });
        successCount++;
      } catch (err) {
        console.error('Upload error:', err);
        toast({ title: `Erro ao enviar ${item.file.name}`, description: err.message, variant: 'destructive' });
      }
    }
    setUploading(false);
    if (successCount > 0) {
      toast({ title: `${successCount} imagem(ns) enviada(s)!` });
    }
    setUploadQueue([]);
    setShowUploadPanel(false);
    load();
  };

  const handleCopyUrl = async (record) => {
    const url = getFullUrl(record);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: 'URL copiado!', description: url });
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm('Apagar esta imagem permanentemente?')) return;
    setDeletingId(record.id);
    try {
      await pb.collection('media').delete(record.id, { requestKey: null });
      setImages(prev => prev.filter(i => i.id !== record.id));
      if (selected?.id === record.id) setSelected(null);
      toast({ title: 'Imagem apagada.' });
      load(); // refresh counts
    } catch (err) {
      toast({ title: 'Erro ao apagar', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveAlt = async () => {
    try {
      await pb.collection('media').update(editingId, { alt: editAlt }, { requestKey: null });
      setImages(prev => prev.map(i => i.id === editingId ? { ...i, alt: editAlt } : i));
      if (selected?.id === editingId) setSelected(s => ({ ...s, alt: editAlt }));
      setEditingId(null);
      toast({ title: 'Alt text guardado.' });
    } catch (err) {
      toast({ title: 'Erro ao guardar', description: err.message, variant: 'destructive' });
    }
  };

  const filteredImages = search.trim()
    ? images.filter(i =>
        i.file.toLowerCase().includes(search.toLowerCase()) ||
        (i.alt || '').toLowerCase().includes(search.toLowerCase())
      )
    : images;

  return (
    <>
      <Helmet>
        <title>Biblioteca de Mídia - Admin</title>
      </Helmet>

      <div className="min-h-full bg-gray-50 flex flex-col">
        {/* Page header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Biblioteca de Mídia</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {counts[''] ?? 0} imagens no total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <input
                type="checkbox"
                checked={convertWebp}
                onChange={e => setConvertWebp(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-xs text-gray-600 whitespace-nowrap">WebP 80%</span>
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFilesSelected(e.target.files)}
            />
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Folder sidebar */}
          <aside className="hidden md:flex flex-col w-44 shrink-0 border-r border-gray-200 bg-white p-3 gap-0.5 pt-4">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pastas</p>
            {FOLDERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFolder(f.value)}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  folder === f.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen size={14} />
                  {f.label}
                </span>
                {counts[f.value] !== undefined && (
                  <span className="text-xs text-gray-400 font-normal">{counts[f.value]}</span>
                )}
              </button>
            ))}
          </aside>

          {/* Main grid area */}
          <div
            className={`flex-1 overflow-y-auto flex flex-col transition-all ${
              dragOver ? 'bg-primary/5 ring-2 ring-primary ring-inset' : ''
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFilesSelected(e.dataTransfer.files); }}
          >
            {/* Search bar */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="relative max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Pesquisar imagens…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Upload panel */}
            {showUploadPanel && uploadQueue.length > 0 && (
              <div className="mx-4 mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-900">{uploadQueue.length} imagem(ns) selecionada(s)</p>
                  <button onClick={() => { setUploadQueue([]); setShowUploadPanel(false); }}>
                    <X size={18} className="text-gray-400 hover:text-gray-700" />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 mb-3">
                  {uploadQueue.map((item, i) => (
                    <div key={i} className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                      <img src={item.preview} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm shrink-0">Pasta:</Label>
                    <select
                      value={uploadFolder}
                      onChange={e => setUploadFolder(e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {FOLDERS.filter(f => f.value !== '').map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleUploadAll}
                    disabled={uploading}
                    className="gap-2 ml-auto"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? 'A enviar…' : 'Enviar tudo'}
                  </Button>
                </div>
              </div>
            )}

            {/* Grid */}
            <div className="p-4 flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 size={40} className="animate-spin text-gray-300" />
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
                  <Images size={56} className="opacity-20" />
                  <div className="text-center">
                    <p className="font-medium text-gray-600">Nenhuma imagem encontrada</p>
                    <p className="text-sm mt-1">Arrasta imagens aqui ou clica em Upload</p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    Fazer upload
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredImages.map(img => (
                    <div
                      key={img.id}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        selected?.id === img.id
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      onClick={() => setSelected(s => s?.id === img.id ? null : img)}
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={getUrl(img)}
                          alt={img.alt || ''}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={e => { e.stopPropagation(); handleCopyUrl(img); }}
                          className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Copiar URL"
                        >
                          {copiedId === img.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(img); setEditingId(img.id); setEditAlt(img.alt || ''); }}
                          className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Editar alt"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(img); }}
                          className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Apagar"
                          disabled={deletingId === img.id}
                        >
                          {deletingId === img.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                          }
                        </button>
                      </div>

                      {/* Folder badge */}
                      {img.folder && (
                        <div className="absolute top-1.5 left-1.5">
                          <span className="bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5">
                            {img.folder}
                          </span>
                        </div>
                      )}

                      {/* Inline alt edit for non-xl screens */}
                      {editingId === img.id && (
                        <div className="xl:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Input
                              size="sm"
                              className="h-7 text-xs flex-1"
                              placeholder="Alt text"
                              value={editAlt}
                              onChange={e => setEditAlt(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveAlt(); if (e.key === 'Escape') setEditingId(null); }}
                              autoFocus
                            />
                            <button onClick={handleSaveAlt} className="text-green-600 hover:text-green-800 p-1">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700 p-1">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side detail panel when image selected */}
          {selected && (
            <aside className="hidden xl:flex flex-col w-64 shrink-0 border-l border-gray-200 bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <p className="font-semibold text-sm text-gray-900">Detalhes</p>
                <button onClick={() => setSelected(null)}>
                  <X size={16} className="text-gray-400 hover:text-gray-700" />
                </button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img
                    src={getUrl(selected, '600x400')}
                    alt={selected.alt || ''}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Ficheiro</p>
                    <p className="text-gray-700 break-all">{selected.file}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Pasta</p>
                    <p className="text-gray-700">{selected.folder || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Alt text</p>
                    {editingId === selected.id ? (
                      <div className="flex gap-2">
                        <Input
                          size="sm"
                          className="h-8 text-sm"
                          value={editAlt}
                          onChange={e => setEditAlt(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveAlt(); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus
                        />
                        <button onClick={handleSaveAlt} className="text-green-600 hover:text-green-800">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-gray-700 flex-1">{selected.alt || <span className="text-gray-400 italic">Sem alt text</span>}</p>
                        <button onClick={() => { setEditingId(selected.id); setEditAlt(selected.alt || ''); }}>
                          <Pencil size={13} className="text-gray-400 hover:text-gray-700" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handleCopyUrl(selected)}
                  >
                    {copiedId === selected.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copiedId === selected.id ? 'Copiado!' : 'Copiar URL'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(selected)}
                    disabled={deletingId === selected.id}
                  >
                    {deletingId === selected.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Apagar
                  </Button>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Drag overlay */}
        {dragOver && (
          <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-dashed border-primary p-12 text-center">
              <Upload size={48} className="text-primary mx-auto mb-3" />
              <p className="text-xl font-bold text-primary">Larga para fazer upload</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MediaLibraryPage;
