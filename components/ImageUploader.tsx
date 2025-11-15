import React, { useRef } from 'react';
import type { ImageFile } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface ImageUploaderProps {
  id: string;
  label: string;
  onImageUpload: (imageFile: ImageFile | null) => void;
  image: ImageFile | null;
  onEdit?: () => void;
  children?: React.ReactNode;
}

export const parseDataUrl = (dataUrl: string): ImageFile => {
    const parts = dataUrl.split(',');
    const mimePart = parts[0].match(/:(.*?);/);
    if (!mimePart || mimePart.length < 2) {
      throw new Error("Invalid data URL");
    }
    const mimeType = mimePart[1];
    const base64 = parts[1];
    return { base64, mimeType };
};

export const resizeImage = (imageUrl: string, targetLongestSide: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            const { naturalWidth: width, naturalHeight: height } = img;
            const aspectRatio = width / height;

            let newWidth, newHeight;

            if (width > height) {
                newWidth = targetLongestSide;
                newHeight = newWidth / aspectRatio;
            } else {
                newHeight = targetLongestSide;
                newWidth = newHeight * aspectRatio;
            }

            canvas.width = Math.round(newWidth);
            canvas.height = Math.round(newHeight);

            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            const mimeType = imageUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
            const dataUrl = canvas.toDataURL(mimeType, 1.0);
            resolve(dataUrl);
        };
        img.onerror = () => {
            reject(new Error('Failed to load image for resizing.'));
        };
        img.src = imageUrl;
    });
};


export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onImageUpload, image, onEdit, children }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          try {
            const parsedImage = parseDataUrl(reader.result);
            onImageUpload(parsedImage);
          } catch (error) {
            console.error("Error parsing data URL:", error);
            onImageUpload(null);
          }
        }
      };
      reader.readAsDataURL(file);
    } else {
        onImageUpload(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageUpload(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-2 truncate">
        {label}
      </label>
      <div
        onClick={handleClick}
        className="relative aspect-square w-full bg-black/20 border-2 border-dashed border-white/30 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-cyan-500/70 hover:text-cyan-400 transition-all duration-200 cursor-pointer overflow-hidden group"
      >
        <input
          type="file"
          id={id}
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        {image ? (
          <>
            <img src={`data:${image.mimeType};base64,${image.base64}`} alt={label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute top-2 end-2 flex flex-col gap-2">
                <button 
                    onClick={handleRemove}
                    aria-label={t('imageUploader.remove')}
                    className="bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-red-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 opacity-0 group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                {onEdit && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        aria-label={t('imageUploader.edit')}
                        className="bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-cyan-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 opacity-0 group-hover:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                           <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="mt-2 block text-sm font-semibold">{t('imageUploader.upload')}</span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
};