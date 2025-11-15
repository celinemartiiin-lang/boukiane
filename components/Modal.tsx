import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  imageUrl?: string | null;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, imageUrl }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `cinematic-scene-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] bg-transparent rounded-lg"
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -end-3 bg-fuchsia-600 text-white rounded-full p-2 hover:bg-fuchsia-500 transition-all z-10 shadow-lg"
          aria-label={t('modal.close')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
        {imageUrl && (
            <button
              onClick={handleDownload}
              className="absolute bottom-4 end-4 flex items-center gap-2 bg-cyan-600 text-white rounded-full py-2 px-4 hover:bg-cyan-500 transition-all z-10 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
              aria-label={t('modal.download')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{t('common.download')}</span>
            </button>
        )}
      </div>
    </div>
  );
};
