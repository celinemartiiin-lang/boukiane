import React, { useEffect, useRef, useState, memo } from 'react';
import type { Character, ImageFile } from '../types';
import { ImageUploader } from './ImageUploader';
import { ImageEditor } from './ImageEditor';
import { useTranslation } from '../contexts/LanguageContext';

interface EditableElementListProps {
  title: string;
  elements: Character[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onNameChange: (id: number, name: string) => void;
  onImageUpload: (id: number, image: ImageFile | null, fileName?: string) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  noun: string; // e.g., "Character", "Object"
  isNameEditable?: boolean;
}

/** Child component for a single item — keeps its own localName state.
 *  Calls onNameChange on blur or Enter to avoid parent re-renders on every keystroke.
 */
const EditableItem: React.FC<{
  elem: Character;
  index: number;
  noun: string;
  title: string;
  isNameEditable: boolean;
  onRemove: (id: number) => void;
  onNameChange: (id: number, name: string) => void;
  onImageUpload: (id: number, image: ImageFile | null, fileName?: string) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, id: number, index: number) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => void;
  onDragEnd?: () => void;
}> = memo(({
  elem,
  index,
  noun,
  title,
  isNameEditable,
  onRemove,
  onNameChange,
  onImageUpload,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  const { t } = useTranslation();
  const [localName, setLocalName] = useState<string>(elem.name || '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<ImageFile | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const shouldEnableEditing = title === t('generate.characters.title') || title === t('generate.objects.title');

  // keep localName in sync if parent updates elem.name externally
  useEffect(() => {
    setLocalName(elem.name || '');
  }, [elem.name]);

  const commitName = () => {
    // only call parent if changed
    if ((elem.name || '') !== (localName || '')) {
      onNameChange(elem.id, localName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // prevent form submits if inside a form
      e.preventDefault();
      commitName();
      inputRef.current?.blur();
    }
  };
  
  const handleInitialImageUpload = (uploadedImage: ImageFile | null) => {
    onImageUpload(elem.id, uploadedImage);
  };
  
  const handleEditClick = () => {
    if (elem.image) {
        setImageToEdit(elem.image);
        setIsEditModalOpen(true);
    }
  };
  
  const handleEditorOnClose = () => {
    setIsEditModalOpen(false);
    setImageToEdit(null);
  };

  const handleEditorOnApply = (newImage: ImageFile) => {
    onImageUpload(elem.id, newImage);
    setIsEditModalOpen(false);
    setImageToEdit(null);
  };


  return (
    <>
      <div
        key={elem.id}
        draggable={!!onDragStart}
        onDragStart={(e) => onDragStart && onDragStart(e, elem.id, index)}
        onDragOver={(e) => onDragOver && onDragOver(e)}
        onDragEnter={(e) => onDragEnter && onDragEnter(e, elem.id)}
        onDragLeave={(e) => onDragLeave && onDragLeave(e)}
        onDrop={(e) => onDrop && onDrop(e, index)}
        onDragEnd={() => onDragEnd && onDragEnd()}
        className={`relative group transition-all duration-200`}
        style={{ cursor: onDragStart ? 'grab' : 'default' }}
      >
        <ImageUploader
          id={`${noun.toLowerCase()}-${elem.id}`}
          label={elem.name || `${noun} ${elem.id}`}
          image={elem.image}
          onImageUpload={handleInitialImageUpload}
          onEdit={shouldEnableEditing ? handleEditClick : undefined}
        >
          {isNameEditable && (
            <input
              ref={inputRef}
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={commitName}
              onKeyDown={handleKeyDown}
              placeholder={t('common.name')}
              className="mt-2 w-full bg-black/30 text-white placeholder-gray-400 text-center text-sm rounded-md border border-white/20 py-1.5 focus:ring-2 focus:ring-inset focus:ring-cyan-500 transition-all"
              aria-label={`${t('common.name')} for ${noun} ${elem.id}`}
            />
          )}
        </ImageUploader>

        <button
          onClick={() => onRemove(elem.id)}
          className="absolute -top-2 -end-2 bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
          aria-label={`${t('common.remove')} ${elem.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {shouldEnableEditing && (
        <ImageEditor
          isOpen={isEditModalOpen}
          onClose={handleEditorOnClose}
          image={imageToEdit}
          onApply={handleEditorOnApply}
        />
      )}
    </>
  );
});

export const EditableElementList: React.FC<EditableElementListProps> = ({
  title,
  elements,
  onAdd,
  onRemove,
  onNameChange,
  onImageUpload,
  onReorder,
  noun,
  isNameEditable = true,
}) => {
  const { t } = useTranslation();
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedItemId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.preventDefault();
    if (draggedItemId !== id) {
      setDragOverItemId(id);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverItemId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (onReorder) {
      const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (dragIndex !== dropIndex) {
        onReorder(dragIndex, dropIndex);
      }
    }
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
        <h2 className="text-xl font-bold text-cyan-300 tracking-wider">{title}</h2>
        <button
          onClick={onAdd}
          className="text-sm border-2 border-cyan-500/50 text-cyan-400 font-bold py-1 px-3 rounded-md hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-colors duration-200"
          aria-label={`${t('common.add')} new ${noun.toLowerCase()}`}
        >
          {t('common.add')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {elements.map((elem, index) => (
          <div
            key={elem.id}
            className={`relative group transition-all duration-200 
              ${draggedItemId === elem.id ? 'opacity-40 scale-95' : 'opacity-100'}
              ${dragOverItemId === elem.id ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-gray-900 rounded-lg' : ''}
            `}
            style={{ cursor: onReorder ? 'grab' : 'default' }}
          >
            <EditableItem
              elem={elem}
              index={index}
              noun={noun}
              title={title}
              isNameEditable={isNameEditable ?? true}
              onRemove={onRemove}
              onNameChange={onNameChange}
              onImageUpload={onImageUpload}
              onDragStart={onReorder ? handleDragStart : undefined}
              onDragOver={onReorder ? handleDragOver : undefined}
              onDragEnter={onReorder ? handleDragEnter : undefined}
              onDragLeave={onReorder ? handleDragLeave : undefined}
              onDrop={onReorder ? handleDrop : undefined}
              onDragEnd={onReorder ? handleDragEnd : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
};