import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Extension } from '@tiptap/core';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Maximize, Minimize,
  Palette, Highlighter, Type, AlignJustify
} from 'lucide-react';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
});

const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {}
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setLineHeight: lineHeight => ({ commands }) => {
        return commands.updateAttributes('paragraph', { lineHeight })
      },
      unsetLineHeight: () => ({ commands }) => {
        return commands.resetAttributes('paragraph', 'lineHeight')
      },
    }
  },
});

const MenuBar = ({ editor, isFullScreen, toggleFullScreen }: any) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-neutral-200 bg-neutral-50 rounded-t-lg sticky top-0 z-10">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${editor.isActive('bold') ? 'bg-neutral-200 text-indigo-600' : 'text-neutral-700'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${editor.isActive('italic') ? 'bg-neutral-200 text-indigo-600' : 'text-neutral-700'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${editor.isActive('underline') ? 'bg-neutral-200 text-indigo-600' : 'text-neutral-700'}`}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${editor.isActive('strike') ? 'bg-neutral-200 text-indigo-600' : 'text-neutral-700'}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-neutral-300 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${editor.isActive('bulletList') ? 'bg-neutral-200 text-indigo-600' : 'text-neutral-700'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${editor.isActive('orderedList') ? 'bg-neutral-200 text-indigo-600' : 'text-neutral-700'}`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-neutral-300 mx-1" />

      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-neutral-200 text-indigo-600' : 'text-neutral-700'}`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-neutral-200 text-indigo-600' : 'text-neutral-700'}`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-neutral-200 text-indigo-600' : 'text-neutral-700'}`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-neutral-200 text-indigo-600' : 'text-neutral-700'}`}
        title="Align Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-neutral-300 mx-1" />

      {/* Font Size Dropdown */}
      <div className="relative group">
        <button className="p-1.5 rounded hover:bg-neutral-200 transition-colors text-neutral-700 flex items-center gap-1" title="Font Size">
          <Type className="w-4 h-4" />
        </button>
        <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded shadow-lg hidden group-hover:block z-20 w-24">
          {['12px', '14px', '16px', '18px', '20px', '24px', '30px'].map(size => (
            <button
              key={size}
              onClick={() => editor.chain().focus().setFontSize(size).run()}
              className="block w-full text-left px-3 py-1 text-sm hover:bg-neutral-100"
            >
              {size}
            </button>
          ))}
          <button
            onClick={() => editor.chain().focus().unsetFontSize().run()}
            className="block w-full text-left px-3 py-1 text-sm hover:bg-neutral-100 border-t border-neutral-100 text-neutral-500"
          >
            Default
          </button>
        </div>
      </div>

      {/* Text Color */}
      <div className="relative group">
        <button className="p-1.5 rounded hover:bg-neutral-200 transition-colors text-neutral-700 flex items-center gap-1" title="Text Color">
          <Palette className="w-4 h-4" />
        </button>
        <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded shadow-lg hidden group-hover:flex flex-wrap w-32 p-1 z-20">
          {['#000000', '#4b5563', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'].map(color => (
            <button
              key={color}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className="w-6 h-6 m-0.5 rounded border border-neutral-200"
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="w-full text-xs text-center mt-1 py-1 text-neutral-500 hover:bg-neutral-100 rounded"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Highlight Color */}
      <div className="relative group">
        <button className="p-1.5 rounded hover:bg-neutral-200 transition-colors text-neutral-700 flex items-center gap-1" title="Highlight Color">
          <Highlighter className="w-4 h-4" />
        </button>
        <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded shadow-lg hidden group-hover:flex flex-wrap w-32 p-1 z-20">
          {['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e5e7eb', '#fca5a5'].map(color => (
            <button
              key={color}
              onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
              className="w-6 h-6 m-0.5 rounded border border-neutral-200"
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            onClick={() => editor.chain().focus().unsetHighlight().run()}
            className="w-full text-xs text-center mt-1 py-1 text-neutral-500 hover:bg-neutral-100 rounded"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Line Spacing */}
      <div className="relative group">
        <button className="p-1.5 rounded hover:bg-neutral-200 transition-colors text-neutral-700 flex items-center gap-1" title="Line Spacing">
          <span className="text-xs font-bold leading-none flex flex-col items-center justify-center h-4">
            <span className="block h-0.5 w-3 bg-current mb-0.5"></span>
            <span className="block h-0.5 w-3 bg-current mb-0.5"></span>
            <span className="block h-0.5 w-3 bg-current"></span>
          </span>
        </button>
        <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded shadow-lg hidden group-hover:block z-20 w-24">
          {['1', '1.2', '1.5', '2'].map(spacing => (
            <button
              key={spacing}
              onClick={() => editor.chain().focus().setLineHeight(spacing).run()}
              className="block w-full text-left px-3 py-1 text-sm hover:bg-neutral-100"
            >
              {spacing}
            </button>
          ))}
          <button
            onClick={() => editor.chain().focus().unsetLineHeight().run()}
            className="block w-full text-left px-3 py-1 text-sm hover:bg-neutral-100 border-t border-neutral-100 text-neutral-500"
          >
            Default
          </button>
        </div>
      </div>

      <div className="w-px h-5 bg-neutral-300 mx-1" />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded hover:bg-neutral-200 transition-colors text-neutral-700 disabled:opacity-50"
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded hover:bg-neutral-200 transition-colors text-neutral-700 disabled:opacity-50"
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      <button
        onClick={toggleFullScreen}
        className="p-1.5 rounded hover:bg-neutral-200 transition-colors text-neutral-700"
        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
      >
        {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>
    </div>
  );
};

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontSize,
      LineHeight,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[150px] p-4',
      },
    },
  });

  // Update editor content if it changes from outside (e.g., AI generation)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const containerClasses = isFullScreen
    ? "fixed inset-0 z-50 bg-white flex flex-col"
    : "border border-neutral-300 rounded-lg overflow-hidden flex flex-col resize-y min-h-[200px] max-h-[600px]";

  const editorClasses = isFullScreen
    ? "flex-1 overflow-y-auto bg-white p-4 max-w-4xl mx-auto w-full"
    : "flex-1 overflow-y-auto bg-white";

  return (
    <div className={containerClasses}>
      <MenuBar editor={editor} isFullScreen={isFullScreen} toggleFullScreen={toggleFullScreen} />
      <div className={editorClasses}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
