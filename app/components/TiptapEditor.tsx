'use client';

import React, { useCallback, useRef } from 'react';
import {
  useEditor, EditorContent, Editor
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Iframe from 'tiptap-extension-iframe';
// --- New Extension Imports ---
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
// ---------------------------
import { toast } from 'react-hot-toast';
import {
  FaBold, FaItalic, FaUnderline, FaStrikethrough, FaCode, FaHighlighter, FaListUl, FaListOl,
  FaQuoteLeft, FaCodeBranch, FaRulerHorizontal, FaLink, FaImage, FaAlignLeft, FaAlignCenter,
  FaAlignRight, FaTable, FaColumns, FaPlusSquare, FaTrashAlt,
  FaFilm, FaPalette, FaMinusSquare,
  // --- New Icons ---
  FaSuperscript,
  FaSubscript,
  FaTasks, // Or FaListCheck
  FaUndo,
  FaRedo,
  FaEraser, // Or FaRemoveFormat
  FaHeading // <-- Add FaHeading for dropdown indicator
  // ---------------
} from 'react-icons/fa';
import { LuHeading1, LuHeading2, LuHeading3, LuHeading4, LuHeading5, LuHeading6 } from "react-icons/lu";

// Toolbar Component
const TiptapToolbar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor || !event.target.files || event.target.files.length === 0) {
        return;
      }
      const file = event.target.files[0];

      // --- Basic Validation (optional but recommended) ---
      if (file.size > 1 * 1024 * 1024) { // 1MB limit example
         toast.error('Image size should be less than 1MB for content insertion.');
         return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid image type. Only JPEG, PNG, WEBP, GIF allowed.');
        return;
      }
      // -----------------------------------------------------

      const uploadToast = toast.loading('Uploading image...');
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Image upload failed');
        }

        if (result.url) {
          editor.chain().focus().setImage({ src: result.url }).run();
          toast.success('Image uploaded and inserted!', { id: uploadToast });
        } else {
           throw new Error('Image URL not found in response.');
        }
      } catch (error: any) {
        console.error('Image upload error:', error);
        toast.error(`Image upload failed: ${error.message}`, { id: uploadToast });
      } finally {
        // Reset file input value so the same file can be selected again
        if (imageInputRef.current) {
           imageInputRef.current.value = '';
        }
      }
  }, [editor]);

  const triggerImageUpload = useCallback(() => {
     imageInputRef.current?.click();
  }, []);

  // --- Add Embed URL handler ---
  const setEmbedUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter Embed URL (e.g., YouTube, Vimeo)');

    // cancelled or empty
    if (url === null || url === '') {
      return;
    }

    // Basic check if it looks like a URL (very simple)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        toast.error('Please enter a valid URL starting with http:// or https://');
        return;
    }

    // Insert the iframe using the extension's command
    // You might want to configure default attributes like width, height, allowfullscreen later
    // @ts-ignore - Ignoring because tiptap-extension-iframe lacks TS types
    editor.chain().focus().setIframe({ src: url }).run();
  }, [editor]);
  // --------------------------

  if (!editor) {
    return null;
  }

  // Helper to check active heading level (supports H1-H6, but we only use up to H5 now)
  const getActiveHeadingLevel = (): 1 | 2 | 3 | 4 | 5 | 6 | 0 => {
    // Check levels 1-5 for activation
    for (let i = 1; i <= 5; i++) { 
        if (editor.isActive('heading', { level: i })) return i as 1 | 2 | 3 | 4 | 5;
    }
    // Check for H6 separately if needed, although it won't be selectable
    // if (editor.isActive('heading', { level: 6 })) return 6;
    return 0; // Return 0 if paragraph or H6+ is active
  }

  return (
    <div className="tiptap-toolbar border border-gray-700 rounded-t-md p-2 bg-dark flex flex-wrap gap-2 items-center">
      {/* -- Undo/Redo -- */}
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="toolbar-icon-button" title="Undo"><FaUndo /></button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="toolbar-icon-button" title="Redo"><FaRedo /></button>
      {/* ------------- */}
      
      {/* -- Headings Dropdown (P, H1-H5) -- */}
      <div className="flex items-center border border-gray-600 rounded">
        <span className="pl-2 text-gray-400" title="Text Style"><FaHeading /></span>
        <select 
           value={getActiveHeadingLevel()} 
           onChange={(e) => { 
               const level = parseInt(e.target.value);
               if (level === 0) { 
                 editor.chain().focus().setParagraph().run(); 
               } else if (level >= 1 && level <= 5) { // Only toggle levels 1-5
                 editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 }).run(); 
               } // No else needed, as higher levels are removed from options
            }}
           className="toolbar-select bg-dark text-white focus:outline-none focus:ring-0 border-none pl-1 pr-2 py-1 rounded-r text-sm"
           title="Text Style"
        >
          <option value="0">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
          <option value="5">Heading 5</option>
        </select>
      </div>
      {/* --------------------------------------------- */}

      {/* Formatting Buttons */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-icon-button ${editor.isActive('bold') ? 'is-active' : ''}`} title="Bold"><FaBold /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-icon-button ${editor.isActive('italic') ? 'is-active' : ''}`} title="Italic"><FaItalic /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`toolbar-icon-button ${editor.isActive('underline') ? 'is-active' : ''}`} title="Underline"><FaUnderline /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`toolbar-icon-button ${editor.isActive('strike') ? 'is-active' : ''}`} title="Strikethrough"><FaStrikethrough /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={`toolbar-icon-button ${editor.isActive('code') ? 'is-active' : ''}`} title="Code"><FaCode /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={`toolbar-icon-button ${editor.isActive('highlight') ? 'is-active' : ''}`} title="Highlight"><FaHighlighter /></button>
      {/* -- Superscript/Subscript -- */}
      <button type="button" onClick={() => editor.chain().focus().toggleSuperscript().run()} className={`toolbar-icon-button ${editor.isActive('superscript') ? 'is-active' : ''}`} title="Superscript"><FaSuperscript /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleSubscript().run()} className={`toolbar-icon-button ${editor.isActive('subscript') ? 'is-active' : ''}`} title="Subscript"><FaSubscript /></button>
      {/* ------------------------- */}
      {/* -- Clear Formatting -- */}
      <button 
        type="button" 
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} 
        className="toolbar-icon-button" 
        title="Clear Formatting"
      >
        <FaEraser />
      </button>
      {/* --------------------- */}
      
      {/* Text Color Picker */}
       <div className="relative toolbar-icon-button" title="Text Color">
           <FaPalette className="pointer-events-none z-10" />
           <input type="color" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()} value={editor.getAttributes('textStyle').color || '#ffffff'} />
       </div>

       {/* Alignment Buttons */}
       <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`toolbar-icon-button ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`} title="Align Left"><FaAlignLeft /></button>
       <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`toolbar-icon-button ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`} title="Align Center"><FaAlignCenter /></button>
       <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`toolbar-icon-button ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`} title="Align Right"><FaAlignRight /></button>

       {/* Lists */}
       <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`toolbar-icon-button ${editor.isActive('bulletList') ? 'is-active' : ''}`} title="Bullet List"><FaListUl /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`toolbar-icon-button ${editor.isActive('orderedList') ? 'is-active' : ''}`} title="Ordered List"><FaListOl /></button>
       {/* -- Task List -- */}
       <button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} className={`toolbar-icon-button ${editor.isActive('taskList') ? 'is-active' : ''}`} title="Task List"><FaTasks /></button>
       {/* ------------- */}
      
      {/* Block Elements */}
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`toolbar-icon-button ${editor.isActive('blockquote') ? 'is-active' : ''}`} title="Blockquote"><FaQuoteLeft /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`toolbar-icon-button ${editor.isActive('codeBlock') ? 'is-active' : ''}`} title="Code Block"><FaCodeBranch /></button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="toolbar-icon-button" title="Horizontal Rule"><FaRulerHorizontal /></button>
       
       {/* Link, Image, Embed */}
       <button type="button" onClick={setLink} className={`toolbar-icon-button ${editor.isActive('link') ? 'is-active' : ''}`} title="Set Link"><FaLink /></button>
       <button type="button" onClick={triggerImageUpload} className="toolbar-icon-button" title="Insert Image"><FaImage /></button>
       <button type="button" onClick={setEmbedUrl} className="toolbar-icon-button" title="Embed Media (Iframe)"><FaFilm /></button>

      {/* Table Buttons */}
      <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="toolbar-icon-button" title="Insert Table"><FaTable /></button>
      <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()} className="toolbar-icon-button" title="Add Column After"><FaColumns /></button> 
      <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()} className="toolbar-icon-button" title="Add Row After"><FaPlusSquare /></button> 
      <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()} className="toolbar-icon-button" title="Delete Column"><FaMinusSquare /></button>
      <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()} className="toolbar-icon-button" title="Delete Row"><FaMinusSquare style={{transform: 'rotate(90deg)'}}/></button> 
      <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()} className="toolbar-icon-button" title="Delete Table"><FaTrashAlt /></button>

       {/* Hidden file input for image upload */}
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} />
    </div>
  );
};

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string; // Optional placeholder prop
}

// Editor Component
const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, placeholder = "Start writing your amazing blog post here..." }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        // History is enabled by default in StarterKit for undo/redo
        // Ensure codeBlock is configured if you want specific languages later
        codeBlock: {
           HTMLAttributes: {
             class: 'bg-dark/80 text-white p-4 rounded text-sm font-mono overflow-x-auto',
           },
         },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Underline,
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'list_item'] }),
      TextStyle, // Needed for Color & Sub/Superscript
      Color.configure({ types: ['textStyle'] }),
      Iframe.configure({ allowFullscreen: true }),
      // --- Add New Extensions ---
      Superscript,
      Subscript,
      TaskList,
      TaskItem.configure({ // Required for TaskList
        nested: true, // Allow nested checklists
        HTMLAttributes: {
           class: 'flex items-center gap-2', // Basic styling for task items
        },
      }),
      Placeholder.configure({
        placeholder: placeholder, // Use prop or default text
         emptyEditorClass: 'is-editor-empty', // Class added to editor when empty
      }),
      CharacterCount.configure({
          // limit: 10000, // Optional character limit
      }),
      // ------------------------
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none text-white min-h-[300px] bg-gray-800',
      },
      // Add custom handling for Tab key in lists if needed (more complex)
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="tiptap-editor-wrapper border border-gray-700 rounded-md bg-gray-800 text-white">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} className="p-4 editor-content-area" /> {/* Added class for potential styling */}
      {/* -- Character Count Display -- */}
      {editor && (
         <div className="character-count text-xs text-right text-gray-400 px-4 py-1 border-t border-gray-700">
           {editor.storage.characterCount.characters()} characters
           {/* / {editor.storage.characterCount.words()} words */} 
         </div>
      )}
      {/* ------------------------- */}
    </div>
  );
};

export default TiptapEditor; 