import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from './Modal';
import { SelectInput } from './SelectInput';
import { getAspectRatioOptions } from '../constants';
import type { ImageFile } from '../types';
import { parseDataUrl } from './ImageUploader';
import { useTranslation } from '../contexts/LanguageContext';

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  image: ImageFile | null;
  onApply: (newImage: ImageFile) => void;
}

const parseAspectRatio = (ratioStr: string): number => {
    const parts = ratioStr.split(':');
    if (parts.length !== 2) return 16 / 9; // default
    try {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (den === 0) return 16/9;
      return num / den;
    } catch(e) {
      return 16/9;
    }
};

export const ImageEditor: React.FC<ImageEditorProps> = ({ isOpen, onClose, image, onApply }) => {
  const { t } = useTranslation();
  const ASPECT_RATIOS = useMemo(() => getAspectRatioOptions(t), [t]);
  const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
        // Reset state when modal opens
        setAspectRatio(ASPECT_RATIOS[0].value);
    }
  }, [isOpen, ASPECT_RATIOS]);
  
  const handleApply = async () => {
    if (!image || !canvasRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            setIsProcessing(false);
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsProcessing(false);
            return;
        }

        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        const originalAspectRatio = originalWidth / originalHeight;
        const targetAspectRatio = parseAspectRatio(aspectRatio);
        
        let newWidth, newHeight;

        if (originalAspectRatio > targetAspectRatio) {
            // Original is wider than target, so match width and increase height
            newWidth = originalWidth;
            newHeight = originalWidth / targetAspectRatio;
        } else {
            // Original is taller than target, so match height and increase width
            newHeight = originalHeight;
            newWidth = originalHeight * targetAspectRatio;
        }

        canvas.width = Math.round(newWidth);
        canvas.height = Math.round(newHeight);
        
        // The default canvas state is transparent, so we don't need to fill it.

        const xOffset = (canvas.width - originalWidth) / 2;
        const yOffset = (canvas.height - originalHeight) / 2;

        ctx.drawImage(img, xOffset, yOffset, originalWidth, originalHeight);
        
        // Always save as PNG to support transparency
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        try {
            const newImageFile = parseDataUrl(dataUrl);
            onApply(newImageFile);
        } catch (error) {
            console.error("Failed to parse new image data URL", error);
        } finally {
            setIsProcessing(false);
        }
    };
    img.onerror = () => {
        console.error("Failed to load image for editing.");
        setIsProcessing(false);
    };
    img.crossOrigin = "anonymous";
    img.src = `data:${image.mimeType};base64,${image.base64}`;
  };

  if (!image) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg text-white">
        <h2 className="text-2xl font-bold mb-4 text-cyan-300">{t('imageEditor.title')}</h2>
        <div className="space-y-4">
            <div className="flex justify-center items-center bg-black/20 p-2 rounded-md">
                <img src={`data:${image.mimeType};base64,${image.base64}`} alt={t('imageEditor.preview')} className="max-h-64 object-contain rounded" />
            </div>
            <SelectInput 
                id="edit-aspect-ratio"
                label={t('imageEditor.targetRatio')}
                value={aspectRatio}
                options={ASPECT_RATIOS}
                onChange={(e) => setAspectRatio(e.target.value)}
            />
            <p className="text-sm text-gray-400 text-center">{t('imageEditor.description')}</p>
        </div>
        <div className="mt-6 flex justify-end gap-4">
            <button
                onClick={onClose}
                className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
            >
                {t('common.cancel')}
            </button>
            <button
                onClick={handleApply}
                disabled={isProcessing}
                className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
            >
                {isProcessing ? t('imageEditor.applying') : t('imageEditor.apply')}
            </button>
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
    </Modal>
  );
};