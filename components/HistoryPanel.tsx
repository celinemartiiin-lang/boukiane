
import React from 'react';
import type { HistoryItem } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onView: (item: HistoryItem) => void;
  onUseForEdit: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  onView,
  onUseForEdit,
  onDelete,
  onClear,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-20 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <aside
        className={`fixed top-0 end-0 h-full w-full max-w-sm bg-gray-900/80 backdrop-blur-lg border-s border-white/10 shadow-2xl z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
        }`}
        aria-label={t('history.title')}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
            <h2 className="text-xl font-bold text-cyan-300 tracking-wider">{t('history.title')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label={t('history.close')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          {/* History List */}
          <div className="flex-grow overflow-y-auto p-4">
            {history.length > 0 ? (
              <ul className="grid grid-cols-2 gap-4">
                {history.map((item) => (
                  <li key={item.id} className="relative group aspect-square bg-black/20 rounded-lg overflow-hidden shadow-md border border-white/10">
                    <img
                      src={`data:${item.image.mimeType};base64,${item.image.base64}`}
                      alt={item.prompt.substring(0, 50)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all flex flex-col items-center justify-center p-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center flex flex-col gap-2 w-full max-w-[120px]">
                         <button onClick={() => onView(item)} className="text-xs bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-cyan-500 hover:text-black rounded px-2 py-1 w-full transition-colors">{t('common.view')}</button>
                         <button onClick={() => onUseForEdit(item)} className="text-xs bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-green-500 hover:text-black rounded px-2 py-1 w-full transition-colors">{t('history.useForEdit')}</button>
                      </div>
                    </div>
                     <button
                        onClick={() => onDelete(item.id)}
                        className="absolute top-1 end-1 bg-red-600 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label={t('history.delete')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-gray-500">
                <p>{t('history.empty')}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <footer className="p-4 border-t border-white/10 flex-shrink-0 space-y-3">
               <p className="text-xs text-center text-gray-500">
                {t('history.limitNote')}
              </p>
              <button
                onClick={onClear}
                className="w-full py-2 px-4 text-sm font-bold text-white bg-red-700 rounded-lg hover:bg-red-600 disabled:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all shadow-lg hover:shadow-red-500/40"
              >
                {t('history.clear')}
              </button>
            </footer>
          )}
        </div>
      </aside>
    </>
  );
};