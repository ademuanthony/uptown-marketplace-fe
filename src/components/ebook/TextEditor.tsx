'use client';

import { useState, useRef, useEffect } from 'react';
import { EbookElement } from '@/services/ebook';
import { useEbookStore } from '@/stores/ebookStore';

interface TextEditorProps {
  element: EbookElement;
  isEditing: boolean;
  onStartEdit: () => void;
  onFinishEdit: () => void;
}

export default function TextEditor({
  element,
  isEditing,
  onStartEdit,
  onFinishEdit,
}: TextEditorProps) {
  const { updateElement } = useEbookStore();
  const elementData = element.element_data || {};
  const styles = element.styles || {};
  const [text, setText] = useState(
    (elementData.text as string) || (elementData.content as string) || '',
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    updateElement(element.id, {
      element_data: {
        ...elementData,
        text: text,
      },
    });
    onFinishEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setText((elementData.text as string) || (elementData.content as string) || '');
      onFinishEdit();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full h-full resize-none border-none outline-none bg-transparent p-2"
        style={{
          fontSize: `${(elementData.fontSize as number) || (styles.fontSize as number) || 16}px`,
          color: (elementData.color as string) || (styles.color as string) || '#000000',
          fontFamily:
            (elementData.fontFamily as string) || (styles.fontFamily as string) || 'Inter',
          fontWeight:
            (elementData.fontWeight as string) || (styles.fontWeight as string) || 'normal',
          fontStyle: (elementData.fontStyle as string) || (styles.fontStyle as string) || 'normal',
          textAlign:
            ((elementData.textAlign || styles.textAlign) as
              | 'left'
              | 'center'
              | 'right'
              | 'justify') || 'left',
        }}
      />
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center p-2 cursor-text"
      onClick={onStartEdit}
      onDoubleClick={onStartEdit}
      style={{
        fontSize: `${(elementData.fontSize as number) || (styles.fontSize as number) || 16}px`,
        color: (elementData.color as string) || (styles.color as string) || '#000000',
        fontFamily: (elementData.fontFamily as string) || (styles.fontFamily as string) || 'Inter',
        fontWeight: (elementData.fontWeight as string) || (styles.fontWeight as string) || 'normal',
        fontStyle: (elementData.fontStyle as string) || (styles.fontStyle as string) || 'normal',
        textAlign:
          ((elementData.textAlign || styles.textAlign) as
            | 'left'
            | 'center'
            | 'right'
            | 'justify') || 'left',
      }}
    >
      {(elementData.text as string) || (elementData.content as string) || 'Click to edit text'}
    </div>
  );
}
