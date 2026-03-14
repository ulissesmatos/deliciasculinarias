import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Link2Off, ImageIcon, Highlighter,
  Undo, Redo, Code, Minus, Upload, Loader2,
} from 'lucide-react';

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

const MenuBar = ({ editor, onUploadImage, uploading }) => {
  const fileInputRef = useRef(null);
  if (!editor) return null;

  const setLink = useCallback(() => {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL do link:', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('URL da imagem:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadImage?.(file);
    e.target.value = '';
  };

  const s = 15;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50/60">
      <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer">
        <Undo size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer">
        <Redo size={s} />
      </MenuButton>

      <Divider />

      <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Título 1">
        <Heading1 size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Título 2">
        <Heading2 size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Título 3">
        <Heading3 size={s} />
      </MenuButton>

      <Divider />

      <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Negrito">
        <Bold size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Itálico">
        <Italic size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Sublinhado">
        <UnderlineIcon size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Riscado">
        <Strikethrough size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Realçar">
        <Highlighter size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Código inline">
        <Code size={s} />
      </MenuButton>

      <Divider />

      <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Lista com marcadores">
        <List size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Lista numerada">
        <ListOrdered size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Citação">
        <Quote size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal">
        <Minus size={s} />
      </MenuButton>

      <Divider />

      <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Alinhar à esquerda">
        <AlignLeft size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Centrar">
        <AlignCenter size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Alinhar à direita">
        <AlignRight size={s} />
      </MenuButton>
      <MenuButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justificar">
        <AlignJustify size={s} />
      </MenuButton>

      <Divider />

      <MenuButton onClick={setLink} isActive={editor.isActive('link')} title="Inserir link">
        <LinkIcon size={s} />
      </MenuButton>
      {editor.isActive('link') && (
        <MenuButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remover link">
          <Link2Off size={s} />
        </MenuButton>
      )}
      <MenuButton onClick={addImage} title="Inserir imagem por URL">
        <ImageIcon size={s} />
      </MenuButton>
      {onUploadImage && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <MenuButton
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Fazer upload de imagem"
          >
            {uploading ? <Loader2 size={s} className="animate-spin" /> : <Upload size={s} />}
          </MenuButton>
        </>
      )}
    </div>
  );
};

const RichTextEditor = ({ value, onChange, placeholder, onImageUpload }) => {
  const [uploading, setUploading] = useState(false);

  // Use a ref so the paste/drop handlers always see the latest callback
  // without needing to recreate the editor
  const onImageUploadRef = useRef(onImageUpload);
  React.useEffect(() => { onImageUploadRef.current = onImageUpload; }, [onImageUpload]);

  const uploadAndInsert = useCallback((editor, file) => {
    if (!onImageUploadRef.current) return false;
    setUploading(true);
    onImageUploadRef.current(file)
      .then(url => {
        editor.chain().focus().setImage({ src: url }).run();
      })
      .catch(err => console.error('[RichTextEditor] Image upload failed:', err))
      .finally(() => setUploading(false));
    return true;
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full mx-auto' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder: placeholder || 'Comece a escrever…' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-6 py-4 text-gray-800',
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(i => i.type.startsWith('image/'));
        if (!imageItem || !onImageUploadRef.current) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        event.preventDefault();
        setUploading(true);
        onImageUploadRef.current(file)
          .then(url => {
            view.dispatch(view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.image.create({ src: url })
            ));
          })
          .catch(err => console.error('[RichTextEditor] Paste upload failed:', err))
          .finally(() => setUploading(false));
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
        // Insert at drop position
        const coords = { left: event.clientX, top: event.clientY };
        const pos = view.posAtCoords(coords)?.pos;
        setUploading(true);
        onImageUploadRef.current(file)
          .then(url => {
            const node = view.state.schema.nodes.image.create({ src: url });
            const tr = view.state.tr;
            if (pos != null) tr.insert(pos, node);
            else tr.replaceSelectionWith(node);
            view.dispatch(tr);
          })
          .catch(err => console.error('[RichTextEditor] Drop upload failed:', err))
          .finally(() => setUploading(false));
        return true;
      },
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableUpload = useCallback((file) => {
    if (!editor) return;
    uploadAndInsert(editor, file);
  }, [editor]); // editor ref is stable after mount

  // Sync external value changes (e.g. language tab switch)
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    // Avoid re-setting if content matches (prevents cursor jump)
    if (value !== current) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  return (
    <div className={`border rounded-lg overflow-hidden bg-white transition-colors ${
      uploading ? 'border-primary/40' : 'border-gray-200'
    }`}>
      <MenuBar editor={editor} onUploadImage={onImageUpload ? stableUpload : null} uploading={uploading} />
      {uploading && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 border-b border-primary/20 text-xs text-primary">
          <Loader2 size={12} className="animate-spin" />
          A fazer upload da imagem…
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
