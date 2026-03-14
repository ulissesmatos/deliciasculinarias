import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Link2Off, ImageIcon, Highlighter,
  Undo, Redo, Code, Minus, Upload, Loader2, Trash2, RefreshCw,
} from 'lucide-react';

// ── Font Size extension (piggybacks on TextStyle mark) ───────────────────────
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size) => ({ chain }) => chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

// ── Custom Image — adds stored `class` attribute so per-image alignment works ─
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: { default: 'rounded-lg max-w-full mx-auto block' },
    };
  },
});

// ── Constants ─────────────────────────────────────────────────────────────────
const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

const IMG_ALIGN = {
  left:   'rounded-lg max-w-[55%] float-left mr-4 mb-2',
  center: 'rounded-lg max-w-full mx-auto block',
  right:  'rounded-lg max-w-[55%] float-right ml-4 mb-2',
};

// ── Shared primitives ─────────────────────────────────────────────────────────
const MenuButton = ({ onClick, isActive, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      isActive
        ? 'bg-primary/15 text-primary'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
    } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-6 bg-gray-200 mx-0.5" />;

// ── Toolbar ───────────────────────────────────────────────────────────────────
// Subscribes to 'transaction' so isActive() reflecting cursor position is always
// fresh (the editor object reference never changes, React needs a nudge).
const MenuBar = ({ editor, onUploadImage, uploading }) => {
  const fileInputRef = useRef(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const handler = () => forceUpdate(n => n + 1);
    editor.on('transaction', handler);
    return () => editor.off('transaction', handler);
  }, [editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL do link:', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImageByUrl = () => {
    const url = window.prompt('URL da imagem:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadImage?.(file);
    e.target.value = '';
  };

  const currentFontSize = editor.getAttributes('textStyle').fontSize || '';
  const s = 15;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50/60">
      <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer"><Undo size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer"><Redo size={s} /></MenuButton>

      <Divider />

      <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Título 1"><Heading1 size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Título 2"><Heading2 size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Título 3"><Heading3 size={s} /></MenuButton>

      <Divider />

      <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Negrito"><Bold size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Itálico"><Italic size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Sublinhado"><UnderlineIcon size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Riscado"><Strikethrough size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Realçar"><Highlighter size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Código inline"><Code size={s} /></MenuButton>

      <Divider />

      {/* Font size select */}
      <select
        title="Tamanho da fonte"
        value={currentFontSize}
        onChange={e => {
          if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run();
          else editor.chain().focus().unsetFontSize().run();
        }}
        className="h-7 px-1.5 text-xs border border-gray-200 rounded bg-white text-gray-600 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
      >
        <option value="">Tamanho</option>
        {FONT_SIZES.map(size => (
          <option key={size} value={size}>{size.replace('px', '')}px</option>
        ))}
      </select>

      <Divider />

      <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Lista com marcadores"><List size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Lista numerada"><ListOrdered size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Citação"><Quote size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal"><Minus size={s} /></MenuButton>

      <Divider />

      <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Alinhar à esquerda"><AlignLeft size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Centrar"><AlignCenter size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Alinhar à direita"><AlignRight size={s} /></MenuButton>
      <MenuButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justificar"><AlignJustify size={s} /></MenuButton>

      <Divider />

      <MenuButton onClick={setLink} isActive={editor.isActive('link')} title="Inserir link"><LinkIcon size={s} /></MenuButton>
      {editor.isActive('link') && (
        <MenuButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remover link"><Link2Off size={s} /></MenuButton>
      )}
      <MenuButton onClick={addImageByUrl} title="Inserir imagem por URL"><ImageIcon size={s} /></MenuButton>
      {onUploadImage && (
        <>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <MenuButton onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Fazer upload de imagem">
            {uploading ? <Loader2 size={s} className="animate-spin" /> : <Upload size={s} />}
          </MenuButton>
        </>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const RichTextEditor = ({ value, onChange, placeholder, onImageUpload }) => {
  const [uploading, setUploading] = useState(false);
  const replaceFileInputRef = useRef(null);

  // Stable ref so paste/drop/replace handlers always see the latest callback
  const onImageUploadRef = useRef(onImageUpload);
  useEffect(() => { onImageUploadRef.current = onImageUpload; }, [onImageUpload]);

  const uploadAndInsert = useCallback((view, file, pos) => {
    if (!onImageUploadRef.current) return;
    setUploading(true);
    onImageUploadRef.current(file)
      .then(url => {
        const node = view.state.schema.nodes.image.create({ src: url });
        const tr = view.state.tr;
        if (pos != null) tr.insert(pos, node);
        else tr.replaceSelectionWith(node);
        view.dispatch(tr);
      })
      .catch(err => console.error('[RichTextEditor] upload failed:', err))
      .finally(() => setUploading(false));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, underline: false }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      CustomImage,
      TextStyle,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder: placeholder || 'Comece a escrever…' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-6 py-4 text-gray-800' },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(i => i.type.startsWith('image/'));
        if (!imageItem || !onImageUploadRef.current) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        event.preventDefault();
        uploadAndInsert(view, file, null);
        return true;
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const items = Array.from(event.dataTransfer?.items || []);
        const imageItem = items.find(i => i.type.startsWith('image/'));
        if (!imageItem || !onImageUploadRef.current) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? null;
        uploadAndInsert(view, file, pos);
        return true;
      },
    },
  });

  // Stable callback for toolbar upload button (defined after useEditor to avoid TDZ)
  const stableUpload = useCallback((file) => {
    if (!editor) return;
    uploadAndInsert(editor.view, file, null);
  }, [editor, uploadAndInsert]);

  // Replace the currently selected image
  const handleReplaceImage = () => {
    if (onImageUploadRef.current) {
      replaceFileInputRef.current?.click();
    } else {
      const url = window.prompt('Novo URL da imagem:');
      if (url && editor) editor.chain().focus().updateAttributes('image', { src: url }).run();
    }
  };

  const handleReplaceFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = '';
    setUploading(true);
    onImageUploadRef.current(file)
      .then(url => editor.chain().focus().updateAttributes('image', { src: url }).run())
      .catch(err => console.error('[RichTextEditor] replace upload failed:', err))
      .finally(() => setUploading(false));
  };

  // Sync external value changes (e.g. language tab switch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) editor.commands.setContent(value || '', false);
  }, [value]);

  return (
    <div className={`border rounded-lg overflow-hidden bg-white transition-colors ${uploading ? 'border-primary/40' : 'border-gray-200'}`}>
      <MenuBar editor={editor} onUploadImage={onImageUpload ? stableUpload : null} uploading={uploading} />

      {uploading && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 border-b border-primary/20 text-xs text-primary">
          <Loader2 size={12} className="animate-spin" />
          A fazer upload da imagem…
        </div>
      )}

      {/* Floating bubble menu — shown when an image node is selected */}
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ state }) => {
            const { selection } = state;
            return selection instanceof NodeSelection && selection.node.type.name === 'image';
          }}
          tippyOptions={{ duration: 150, placement: 'top' }}
        >
          <div className="flex items-center gap-0.5 bg-gray-900 text-white rounded-lg px-1.5 py-1 shadow-xl">
            {/* Alignment */}
            <button type="button" title="Alinhar à esquerda"
              onClick={() => editor.chain().focus().updateAttributes('image', { class: IMG_ALIGN.left }).run()}
              className="p-1.5 rounded hover:bg-white/20 transition-colors">
              <AlignLeft size={13} />
            </button>
            <button type="button" title="Centrar"
              onClick={() => editor.chain().focus().updateAttributes('image', { class: IMG_ALIGN.center }).run()}
              className="p-1.5 rounded hover:bg-white/20 transition-colors">
              <AlignCenter size={13} />
            </button>
            <button type="button" title="Alinhar à direita"
              onClick={() => editor.chain().focus().updateAttributes('image', { class: IMG_ALIGN.right }).run()}
              className="p-1.5 rounded hover:bg-white/20 transition-colors">
              <AlignRight size={13} />
            </button>

            <div className="w-px h-4 bg-white/25 mx-0.5" />

            {/* Replace */}
            <button type="button" title="Substituir imagem" onClick={handleReplaceImage}
              className="p-1.5 rounded hover:bg-white/20 transition-colors">
              <RefreshCw size={13} />
            </button>

            {/* Remove */}
            <button type="button" title="Remover imagem"
              onClick={() => editor.chain().focus().deleteSelection().run()}
              className="p-1.5 rounded hover:bg-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </BubbleMenu>
      )}

      {/* Hidden file input for image replace */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplaceFileSelect}
      />

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
