"use client";

import React, { useRef, useState } from "react";
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from '@tiptap/extension-text-align';
import Blockquote from '@tiptap/extension-blockquote';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageIcon,
  Upload,
  Loader2,
  Quote
} from 'lucide-react';
import { resolveAssetUrl } from '@/lib/asset';

type Props = {
  initialHtml?: string;
  onChange?: (html: string) => void;
};

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export default function StoryEventEditorClient({ initialHtml = "", onChange }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [imageInsertSize, setImageInsertSize] = useState<'small'|'medium'|'original'>('medium');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Image,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Blockquote,
    ],
    // Prevent hydration mismatch when server-side rendering
    immediatelyRender: false,
    content: initialHtml,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const insertImage = (url: string) => {
    if (!editor) return;
    const resolved = resolveAssetUrl(url) || url;
    editor.chain().focus().setImage({ src: resolved }).run();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', f);
      const data = await (await import('@/lib/admin-api')).uploadStoryImage(fd, {
        onUploadProgress: (ev: ProgressEvent) => {
          if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
        },
      });
      // choose which url to insert based on toolbar selector
      let url: string | undefined;
      if (imageInsertSize === 'small' && data?.thumbnails?.small) url = data.thumbnails.small;
      else if (imageInsertSize === 'original' && data?.path) url = data.path;
      else url = (data && data.thumbnails && data.thumbnails.medium) ? data.thumbnails.medium : data?.path;
      if (url) insertImage(url);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Image upload failed');
    } finally {
      setUploading(false);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Story Event Content Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-3 bg-muted/50 rounded-lg border">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <Button
              variant={editor?.isActive('bold') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="Bold (Ctrl/Cmd+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>

            <Button
              variant={editor?.isActive('italic') ? 'ghost' : 'ghost'}
              size="sm"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="Italic (Ctrl/Cmd+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>

            <Button
              variant={editor?.isActive('blockquote') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <Button
              variant={editor?.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>

            <Button
              variant={editor?.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>

            <Button
              variant={editor?.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <Button
              variant={editor?.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              title="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>

            <Button
              variant={editor?.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              title="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>

            <Button
              variant={editor?.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              title="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Link */}
          <Button
            variant={editor?.isActive('link') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              const prev = editor?.getAttributes('link')?.href as string | undefined;
              const url = window.prompt('Enter URL', prev || '');
              if (url === null) return; // cancelled
              if (url === '') {
                editor?.chain().focus().extendMarkRange('link').unsetLink().run();
                return;
              }

              // ask if user wants to open in new tab
              const openInNew = window.confirm('Open link in new tab? (OK = yes)');
              const attrs: { href: string; target?: string; rel?: string } = { href: url };
              if (openInNew) {
                attrs.target = '_blank';
                attrs.rel = 'noopener noreferrer';
              }

              // if there's a non-empty selection, apply link to selection; otherwise insert an <a> tag containing the URL
              const selection = editor?.state.selection;
              const isCollapsed = !!selection && selection.empty;
              if (isCollapsed) {
                // ask for link text (default to url)
                const text = window.prompt('Text to display for the link', url) || url;
                const targetAttrs = openInNew ? ' target="_blank" rel="noopener noreferrer"' : '';
                // insert an HTML anchor so attributes are preserved
                editor?.chain().focus().insertContent(`<a href="${escapeHtml(url)}"${targetAttrs}>${escapeHtml(text)}</a>`).run();
              } else {
                editor?.chain().focus().extendMarkRange('link').setLink(attrs).run();
              }
            }}
            title="Insert / edit link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Image Upload */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress ? `${progress}%` : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Insert Image
                </>
              )}
            </Button>

            <Select value={imageInsertSize} onValueChange={(v) => setImageInsertSize(v as 'small'|'medium'|'original')}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="original">Original</SelectItem>
              </SelectContent>
            </Select>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
              disabled={uploading}
            />
          </div>
        </div>

        {/* Editor Content */}
        <div className="min-h-[300px] border rounded-lg p-4 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <EditorContent
            editor={editor}
            className="tiptap focus:outline-none [&_*]:!m-0 [&_*]:!p-0"
          />
        </div>

        {/* Status */}
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading image...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
