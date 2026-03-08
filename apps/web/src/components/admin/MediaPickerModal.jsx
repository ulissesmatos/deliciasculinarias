import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Images, Link2, Check, Loader2, FolderOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import pb from '@/lib/pocketbaseClient.js';
import { convertToWebp } from '@/lib/convertToWebp.js';
import { useWebpConversion } from '@/hooks/useWebpConversion.js';

const FOLDERS = [
  { value: '',        label: 'Todas' },
  { value: 'blog',    label: 'Blog' },
  { value: 'receitas', label: 'Receitas' },
  { value: 'geral',   label: 'Geral' },
];

const TABS = [
  { id: 'library', label: 'Biblioteca', icon: Images },
  { id: 'upload',  label: 'Upload',     icon: Upload },
  { id: 'url',     label: 'URL Externa', icon: Link2 },
];

/**
 * MediaPickerModal
 * Props:
 *   onSelect(url: string) — called with the chosen image URL
 *   onClose()
 *   defaultFolder — pre-selected folder tab: 'blog' | 'receitas' | 'geral' | ''
 */
const MediaPickerModal = ({ onSelect, onClose, defaultFolder = '' }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('library');
  const [folder, setFolder] = useState(defaultFolder);

  // Library
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadFolder, setUploadFolder] = useState(defaultFolder || 'geral');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [convertWebp] = useWebpConversion();
  const uploadInputRef = useRef(null);

  // URL
  const [externalUrl, setExternalUrl] = useState('');

  // Drag-over state for drop zone
  const [dragOver, setDragOver] = useState(false);

  const loadImages = useCallback(async () => {
    setLoadingImages(true);
    try {
      const filter = folder ? pb.filter('folder = {:f}', { f: folder }) : undefined;
      const filterOpts = filter ? { filter } : {};
      const result = await pb.collection('media').getList(1, 500, {
        sort: '-created',
        ...filterOpts,
        requestKey: null,
      });
      setImages(result.items);
    } catch (err) {
      console.error('Error loading media:', err);
    } finally {
      setLoadingImages(false);
    }
  }, [folder]);

  useEffect(() => {
    if (activeTab === 'library') loadImages();
  }, [activeTab, folder, loadImages]);

  const getMediaUrl = (record, size = '300x300') =>
    pb.files.getURL(record, record.file, { thumb: size });

  const handleLibrarySelect = () => {
    const record = images.find(i => i.id === selectedId);
    if (!record) return;
    onSelect(pb.files.getURL(record, record.file));
  };

  const handleUploadFileChange = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleUploadFileChange(file);
    setActiveTab('upload');
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const file = convertWebp ? await convertToWebp(uploadFile) : uploadFile;
      const data = new FormData();
      data.append('file', file);
      data.append('folder', uploadFolder);
      data.append('alt', uploadAlt);
      const record = await pb.collection('media').create(data, { requestKey: null });
      toast({ title: 'Imagem enviada para a biblioteca!' });
      onSelect(pb.files.getURL(record, record.file));
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlConfirm = () => {
    const trimmed = externalUrl.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed); // validate URL
      onSelect(trimmed);
    } catch {
      toast({ title: 'URL inválida', description: 'Introduza um URL completo (https://…)', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Escolher Imagem</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ── Library Tab ── */}
          {activeTab === 'library' && (
            <div className="flex flex-1 min-h-0">
              {/* Folder sidebar */}
              <div className="w-36 shrink-0 border-r border-gray-100 p-3 space-y-0.5">
                {FOLDERS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFolder(f.value)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      folder === f.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FolderOpen size={14} />
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Image grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingImages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={32} className="animate-spin text-gray-400" />
                  </div>
                ) : images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                    <Images size={48} className="opacity-30" />
                    <p className="text-sm">Nenhuma imagem nesta pasta</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('upload')}
                      className="gap-2"
                    >
                      <Upload size={14} />
                      Fazer upload
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {images.map(img => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedId(img.id === selectedId ? null : img.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedId === img.id
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={getMediaUrl(img)}
                          alt={img.alt || ''}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {selectedId === img.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                              <Check size={14} className="text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Upload Tab ── */}
          {activeTab === 'upload' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Drop zone */}
              <div
                className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
                } ${uploadPreview ? 'aspect-video overflow-hidden' : 'py-12'}`}
                onClick={() => uploadInputRef.current?.click()}
              >
                {uploadPreview ? (
                  <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Upload size={36} />
                    <div className="text-center">
                      <p className="font-medium text-gray-700">Clica ou arrasta uma imagem</p>
                      <p className="text-xs mt-1">JPG, PNG, GIF, WebP, SVG · máx 10 MB</p>
                    </div>
                  </div>
                )}
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleUploadFileChange(e.target.files[0])}
                />
              </div>

              {uploadPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                  className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X size={14} /> Remover imagem
                </Button>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Pasta</Label>
                  <select
                    value={uploadFolder}
                    onChange={e => setUploadFolder(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {FOLDERS.filter(f => f.value !== '').map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Alt text (opcional)</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="Descrição da imagem"
                    value={uploadAlt}
                    onChange={e => setUploadAlt(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── URL Tab ── */}
          {activeTab === 'url' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <Label className="text-sm font-medium">URL da imagem</Label>
                <Input
                  type="url"
                  className="mt-2"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={externalUrl}
                  onChange={e => setExternalUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlConfirm()}
                />
              </div>
              {externalUrl && (
                <div className="rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                  <img
                    src={externalUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center shrink-0 bg-gray-50 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>

          {activeTab === 'library' && (
            <Button
              onClick={handleLibrarySelect}
              disabled={!selectedId}
              className="gap-2"
            >
              <Check size={16} />
              Usar esta imagem
            </Button>
          )}

          {activeTab === 'upload' && (
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              className="gap-2"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? 'A enviar…' : 'Enviar e usar'}
            </Button>
          )}

          {activeTab === 'url' && (
            <Button
              onClick={handleUrlConfirm}
              disabled={!externalUrl.trim()}
              className="gap-2"
            >
              <Check size={16} />
              Usar este URL
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPickerModal;
