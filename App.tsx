import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Character, ImageFile, HistoryItem } from './types';
import { 
    getAspectRatioOptions, 
    getLightingStyleOptions, 
    getCameraPerspectiveOptions, 
    getNumberOfImagesOptions,
    getArtisticStyleOptions
} from './constants';
import { ImageUploader, parseDataUrl, resizeImage } from './components/ImageUploader';
import { SelectInput } from './components/SelectInput';
import { GeneratedImageDisplay } from './components/GeneratedImageDisplay';
import { generateStoryImage } from './services/geminiService';
import { Modal } from './components/Modal';
import { EditableElementList } from './components/EditableElementList';
import { HistoryPanel } from './components/HistoryPanel';
import { useTranslation } from './contexts/LanguageContext';
import { ProgressBar } from './components/ProgressBar';

// --- Helper Components (Moved Outside App) ---

const TabButton: React.FC<{
    tabName: 'generate' | 'edit';
    label: string;
    activeTab: 'generate' | 'edit';
    onClick: (tabName: 'generate' | 'edit') => void;
}> = ({ tabName, label, activeTab, onClick }) => (
     <button
        onClick={() => onClick(tabName)}
        className={`px-6 py-3 text-lg font-semibold transition-all duration-300 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-t-lg
            ${activeTab === tabName 
            ? 'text-cyan-300' 
            : 'text-gray-500 hover:text-cyan-400'
        }`}
    >
        {label}
        {activeTab === tabName && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
        )}
    </button>
);

const MainPanel: React.FC<{children: React.ReactNode; className?: string}> = ({children, className}) => (
    <div className={`bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 ${className}`}>
        {children}
    </div>
);

const SectionHeader: React.FC<{children: React.ReactNode}> = ({children}) => (
    <h2 className="text-xl font-bold text-cyan-300 tracking-wider mb-4 border-b border-white/10 pb-3">{children}</h2>
);


// --- Main App Component ---

const MAX_HISTORY_ITEMS = 10;
const HISTORY_IMAGE_SIZE = 512; // Resize history images to save space

const App: React.FC = () => {
    const { t, toggleLanguage, language } = useTranslation();
    
    // Dynamic constants based on language
    const ASPECT_RATIOS = useMemo(() => getAspectRatioOptions(t), [t]);
    const ARTISTIC_STYLES = useMemo(() => getArtisticStyleOptions(t), [t]);
    const LIGHTING_STYLES = useMemo(() => getLightingStyleOptions(t), [t]);
    const CAMERA_PERSPECTIVES = useMemo(() => getCameraPerspectiveOptions(t), [t]);
    const NUMBER_OF_IMAGES = useMemo(() => getNumberOfImagesOptions(t), [t]);

    const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate');

    // === COMMON STATE ===
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    // === GENERATE TAB STATE ===
    const [characters, setCharacters] = useState<Character[]>([
        { id: 1, name: "homme", image: null },
        { id: 2, name: "femme", image: null },
    ]);
    const [additionalElements, setAdditionalElements] = useState<Character[]>([]);
    const [sceneDescription, setSceneDescription] = useState<string>('');
    const [sceneLocationImage, setSceneLocationImage] = useState<ImageFile | null>(null);
    const [styleImage, setStyleImage] = useState<ImageFile | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
    const [artisticStyle, setArtisticStyle] = useState<string>(ARTISTIC_STYLES[0].value);
    const [lightingStyle, setLightingStyle] = useState<string>(LIGHTING_STYLES[0].value);
    const [cameraPerspective, setCameraPerspective] = useState<string>(CAMERA_PERSPECTIVES[0].value);
    const [numberOfImages, setNumberOfImages] = useState<number>(1);
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [genLoading, setGenLoading] = useState<boolean>(false);
    const [genError, setGenError] = useState<string | null>(null);

    // === EDIT TAB STATE ===
    const [editBaseImage, setEditBaseImage] = useState<ImageFile | null>(null);
    const [editAddChars, setEditAddChars] = useState<Character[]>([]);
    const [editAddObjs, setEditAddObjs] = useState<Character[]>([]);
    const [standaloneEditPrompt, setStandaloneEditPrompt] = useState<string>('');
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [editLoading, setEditLoading] = useState<boolean>(false);
    const [editError, setEditError] = useState<string | null>(null);
    
    // === DERIVED STATE ===
    const hasSceneDescription = sceneDescription.trim() !== '';
    const hasCharacterImage = characters.some(c => c.image !== null);
    const hasElementImage = additionalElements.some(e => e.image !== null);
    const hasLocationImage = sceneLocationImage !== null;
    const isGenerationDisabled = !(hasSceneDescription || hasCharacterImage || hasElementImage || hasLocationImage) || genLoading;
    const isEditDisabled = !editBaseImage || standaloneEditPrompt.trim() === '' || editLoading;

    // === EFFECTS ===
    
    // Load history from local storage on mount
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('generationHistory');
            if (storedHistory) {
                const parsedHistory: HistoryItem[] = JSON.parse(storedHistory);
                if (Array.isArray(parsedHistory)) {
                    // Enforce limit on loaded history to prevent issues
                    setHistory(parsedHistory.slice(0, MAX_HISTORY_ITEMS));
                }
            }
        } catch (error) {
            console.error("Failed to load history from local storage:", error);
            localStorage.removeItem('generationHistory');
        }
    }, []);

    // Save history to local storage whenever it changes
    useEffect(() => {
        try {
            if (history.length > 0) {
              localStorage.setItem('generationHistory', JSON.stringify(history));
            } else {
              localStorage.removeItem('generationHistory');
            }
        } catch (error) {
            console.error("Failed to save history to local storage:", error);
        }
    }, [history]);

    // Prompt generator for the "Generate" tab
    useEffect(() => {
        if (activeTab !== 'generate') return;

        const characterNames = characters
            .filter(c => c.image !== null && c.name.trim() !== '')
            .map(c => `(${c.name.trim()})`)
            .join(', ');

        const elementNames = additionalElements
            .filter(e => e.image !== null && e.name.trim() !== '')
            .map(e => `(${e.name.trim()})`)
            .join(', ');
            
        const promptParts: string[] = [];

        // 1. Core Request & Style
        promptParts.push(`Generate a cinematic image in a ${artisticStyle} style.`);

        // 2. Scene Description
        if (sceneDescription) {
            promptParts.push(`The scene is: ${sceneDescription}.`);
        }

        // 3. Composition & Framing
        promptParts.push(`Use a ${cameraPerspective} with a ${aspectRatio} aspect ratio.`);
        
        // 4. Lighting
        promptParts.push(`The lighting is ${lightingStyle}.`);

        // 5. Content & Integration
        const characterIntegration = characterNames ? `Integrate the characters ${characterNames} from their reference images.` : '';
        const elementIntegration = elementNames ? `Integrate the objects ${elementNames} from their reference images.` : '';
        const locationIntegration = sceneLocationImage ? 'Use the provided "Scene Location" image as the background environment.' : '';
        
        const integrationInstructions = [characterIntegration, elementIntegration, locationIntegration].filter(Boolean).join(' ');
        if (integrationInstructions) {
            promptParts.push(integrationInstructions);
        }
        
        // 6. Style Image
        if (styleImage) {
            promptParts.push('Use the "Style Reference" image to influence the overall visual style and color palette.');
        }

        // 7. Critical Transparency Instruction
        if (hasCharacterImage || hasElementImage) {
            promptParts.push(`CRITICAL INSTRUCTION: For any reference images with transparent padding, you must fill these transparent areas by extending the generated scene into them. The final image must be a complete, seamless scene from edge to edge. DO NOT render black bars, borders, letterboxing, or pillarboxing. The subjects from the reference images must be perfectly and naturally integrated into the new environment.`);
        }
        
        const newPrompt = promptParts.filter(p => p).join(' ');
        setGeneratedPrompt(newPrompt);

    }, [characters, additionalElements, sceneDescription, aspectRatio, artisticStyle, lightingStyle, cameraPerspective, styleImage, sceneLocationImage, activeTab, hasCharacterImage, hasElementImage]);

    // === HANDLERS ===
    
    const handleAddToHistory = useCallback(async (image: string, prompt: string, type: 'gen' | 'edit') => {
        try {
            const resizedImage = await resizeImage(image, HISTORY_IMAGE_SIZE);
            const newHistoryItem: HistoryItem = {
                id: `${type}-${Date.now()}`,
                image: parseDataUrl(resizedImage),
                prompt: prompt,
                createdAt: new Date().toISOString(),
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, MAX_HISTORY_ITEMS));
        } catch (error) {
            console.error("Failed to parse or resize image for history:", error);
        }
    }, []);

    const handleReorder = <T,>(
        list: T[],
        setList: React.Dispatch<React.SetStateAction<T[]>>,
        startIndex: number,
        endIndex: number
      ) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        setList(result);
    };

    // Handlers for GENERATE tab
    const handleGenerateClick = useCallback(async () => {
        if (isGenerationDisabled) return;

        setGenLoading(true);
        setGenError(null);
        setGeneratedImages([]);

        const characterImages = characters.map(c => c.image).filter((img): img is ImageFile => img !== null);
        const elementImages = additionalElements.map(e => e.image).filter((img): img is ImageFile => img !== null);
        const locationImage = sceneLocationImage ? [sceneLocationImage] : [];
        
        try {
            const generationPromises = Array.from({ length: numberOfImages }, () => 
                generateStoryImage({
                    prompt: generatedPrompt,
                    characterImages: [...locationImage, ...characterImages, ...elementImages],
                    styleImage,
                })
            );

            const results = await Promise.all(generationPromises);

            setGeneratedImages(results);
            
            results.forEach(resultImage => {
                handleAddToHistory(resultImage, generatedPrompt, 'gen');
            });
        } catch (err: unknown) {
            setGenError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setGenLoading(false);
        }
    }, [generatedPrompt, characters, additionalElements, styleImage, sceneLocationImage, isGenerationDisabled, numberOfImages, handleAddToHistory]);
    
    // Handlers for EDIT tab
     const handleApplyStandaloneEdit = useCallback(async () => {
        if (isEditDisabled) return;

        setEditLoading(true);
        setEditError(null);
        setEditedImage(null);

        const characterImages = editAddChars.map(c => c.image).filter((img): img is ImageFile => img !== null);
        const elementImages = editAddObjs.map(o => o.image).filter((img): img is ImageFile => img !== null);
        const charNames = editAddChars.filter(c => c.image).map(c => `(${c.name})`).join(', ');
        const objNames = editAddObjs.filter(o => o.image).map(o => `(${o.name})`).join(', ');

        let prompt = `Apply this edit to the base image: ${standaloneEditPrompt}.`;
        if(charNames) prompt += ` Use the provided reference images for these characters: ${charNames}.`;
        if(objNames) prompt += ` Use the provided reference images for these objects: ${objNames}.`;

        try {
            const resultImage = await generateStoryImage({
                prompt: prompt,
                characterImages: [...characterImages, ...elementImages],
                styleImage: null,
                baseImage: editBaseImage,
            });
            setEditedImage(resultImage);
            handleAddToHistory(resultImage, prompt, 'edit');
        } catch (err: unknown) {
            setEditError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setEditLoading(false);
        }
    }, [editBaseImage, standaloneEditPrompt, editAddChars, editAddObjs, isEditDisabled, handleAddToHistory]);

    // Handlers for HISTORY
    const handleViewHistoryItem = (item: HistoryItem) => {
        const imageUrl = `data:${item.image.mimeType};base64,${item.image.base64}`;
        setViewingImage(imageUrl);
    };

    const handleUseForEdit = (item: HistoryItem) => {
        setEditBaseImage(item.image);
        setActiveTab('edit');
        setIsHistoryPanelOpen(false);
    };

    const handleDeleteFromHistory = (id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    };

    const handleClearHistory = () => {
        if (window.confirm(t('history.clearConfirm'))) {
            setHistory([]);
        }
    };
    
    return (
        <div className="min-h-screen bg-transparent font-sans text-gray-200">
            <header className="bg-transparent sticky top-0 z-20">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center border-b border-white/10">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white tracking-wide">
                            {t('header.title')}
                        </h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <button
                            onClick={toggleLanguage}
                            className="font-bold text-cyan-400 border-2 border-cyan-500/0 hover:border-cyan-500/50 rounded-lg w-12 h-10 transition-all text-sm"
                            aria-label={`Switch language to ${language === 'en' ? 'Arabic' : 'English'}`}
                        >
                            {t('header.toggleLang')}
                        </button>
                        <button
                            onClick={() => setIsHistoryPanelOpen(true)}
                            className="flex items-center gap-2 border-2 border-cyan-500/50 text-cyan-400 font-bold py-2 px-5 rounded-lg hover:bg-cyan-500 hover:text-black hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all duration-300 text-sm"
                            aria-label="Open generation history"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{t('header.history')}</span>
                        </button>
                     </div>
                </div>
            </header>

             <div className="container mx-auto px-6 pt-6">
                <div className="flex border-b border-white/10">
                    <TabButton tabName="generate" label={t('tabs.generate')} activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton tabName="edit" label={t('tabs.edit')} activeTab={activeTab} onClick={setActiveTab} />
                </div>
            </div>
            
            <main key={activeTab} className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start fade-in">
                {activeTab === 'generate' ? (
                    <>
                        {/* Left Panel: Inputs */}
                        <MainPanel className="lg:col-span-4 space-y-8">
                            <EditableElementList
                                title={t('generate.characters.title')} elements={characters}
                                onAdd={() => setCharacters(prev => [...prev, { id: Date.now(), name: `${t('generate.characters.placeholder')} ${prev.length + 1}`, image: null }])}
                                onRemove={id => setCharacters(prev => prev.filter(c => c.id !== id))}
                                onNameChange={(id, name) => setCharacters(prev => prev.map(c => c.id === id ? { ...c, name } : c))}
                                onImageUpload={(id, image) => setCharacters(prev => prev.map(c => c.id === id ? { ...c, image } : c))}
                                onReorder={(startIndex, endIndex) => handleReorder(characters, setCharacters, startIndex, endIndex)}
                                noun={t('common.character')}
                            />
                            <EditableElementList
                                title={t('generate.objects.title')} elements={additionalElements}
                                onAdd={() => setAdditionalElements(prev => [...prev, { id: Date.now(), name: `${t('generate.objects.placeholder')} ${prev.length + 1}`, image: null }])}
                                onRemove={id => setAdditionalElements(prev => prev.filter(c => c.id !== id))}
                                onNameChange={(id, name) => setAdditionalElements(prev => prev.map(c => c.id === id ? { ...c, name } : c))}
                                onImageUpload={(id, image) => setAdditionalElements(prev => prev.map(c => c.id === id ? { ...c, image } : c))}
                                onReorder={(startIndex, endIndex) => handleReorder(additionalElements, setAdditionalElements, startIndex, endIndex)}
                                noun={t('common.object')}
                            />
                            <section>
                                <SectionHeader>{t('generate.scene.title')}</SectionHeader>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="scene-description" className="block text-sm font-medium text-gray-400 mb-2">{t('generate.scene.descriptionLabel')}</label>
                                        <textarea
                                            id="scene-description" value={sceneDescription} onChange={(e) => setSceneDescription(e.target.value)}
                                            rows={4} className="w-full bg-black/30 border border-white/20 text-gray-200 rounded-lg shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-500 resize-y transition-all"
                                            placeholder={t('generate.scene.descriptionPlaceholder')}/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ImageUploader id="scene-location" label={t('generate.scene.locationLabel')} image={sceneLocationImage} onImageUpload={setSceneLocationImage} />
                                        <ImageUploader id="style" label={t('generate.scene.styleLabel')} image={styleImage} onImageUpload={setStyleImage} />
                                    </div>
                                </div>
                            </section>
                            <section>
                                <SectionHeader>{t('controls.title')}</SectionHeader>
                                <div className="space-y-4">
                                    <SelectInput id="aspectRatio" label={t('imageEditor.targetRatio')} value={aspectRatio} options={ASPECT_RATIOS} onChange={(e) => setAspectRatio(e.target.value)} />
                                    <SelectInput id="artisticStyle" label={t('controls.styleLabel')} value={artisticStyle} options={ARTISTIC_STYLES} onChange={(e) => setArtisticStyle(e.target.value)} />
                                    <SelectInput id="lighting" label={t('constants.lighting.studio')} value={lightingStyle} options={LIGHTING_STYLES} onChange={(e) => setLightingStyle(e.target.value)} />
                                    <SelectInput id="perspective" label={t('constants.perspectives.eyeLevel')} value={cameraPerspective} options={CAMERA_PERSPECTIVES} onChange={(e) => setCameraPerspective(e.target.value)} />
                                    <SelectInput id="numberOfImages" label={t('constants.imageCount.one')} value={String(numberOfImages)} options={NUMBER_OF_IMAGES} onChange={(e) => setNumberOfImages(parseInt(e.target.value, 10))} />
                                </div>
                            </section>
                        </MainPanel>

                        {/* Right Panel: Output and Prompt */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <MainPanel className="flex-grow flex flex-col min-h-[60vh]">
                                <div className="flex-grow p-2 min-h-0">
                                    <GeneratedImageDisplay images={generatedImages} isLoading={genLoading} error={genError} onView={setViewingImage} />
                                </div>
                            </MainPanel>
                            <MainPanel>
                                <h2 className="text-xl font-bold text-cyan-300 tracking-wider mb-3">{t('generate.prompt.title')}</h2>
                                <textarea value={generatedPrompt} readOnly rows={3} className="w-full bg-black/40 border border-cyan-500/50 rounded-lg p-3 text-cyan-200/80 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y shadow-[inset_0_0_10px_rgba(6,182,212,0.2),0_0_15px_rgba(6,182,212,0.3)] font-mono" placeholder={t('generate.prompt.placeholder')} />
                                <div className="mt-4">
                                    <button onClick={handleGenerateClick} disabled={isGenerationDisabled} className={`w-full py-4 px-6 text-xl font-bold text-black bg-cyan-400 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 
                                        ${!genLoading ? 'breathing-glow hover:shadow-[0_0_25px_rgba(6,182,212,0.8)]' : ''} 
                                        disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none`}>
                                        {genLoading ? t('generate.buttons.generating') : t('generate.buttons.generate')}
                                    </button>
                                    {genLoading && <ProgressBar />}
                                </div>
                            </MainPanel>
                        </div>
                    </>
                ) : (
                     <>
                        {/* Left Panel: Edit Inputs */}
                        <MainPanel className="lg:col-span-4 space-y-8">
                            <section>
                                <SectionHeader>{t('edit.baseImage.title')}</SectionHeader>
                                <ImageUploader id="edit-base" label={t('edit.baseImage.label')} image={editBaseImage} onImageUpload={setEditBaseImage} />
                            </section>
                            <EditableElementList
                                title={t('edit.addCharacters.title')} elements={editAddChars}
                                onAdd={() => setEditAddChars(prev => [...prev, { id: Date.now(), name: `${t('common.character')} ${prev.length + 1}`, image: null }])}
                                onRemove={id => setEditAddChars(prev => prev.filter(c => c.id !== id))}
                                onNameChange={(id, name) => setEditAddChars(prev => prev.map(c => c.id === id ? { ...c, name } : c))}
                                onImageUpload={(id, image) => setEditAddChars(prev => prev.map(c => c.id === id ? { ...c, image } : c))}
                                noun={t('common.character')}
                            />
                            <EditableElementList
                                title={t('edit.addObjects.title')} elements={editAddObjs}
                                onAdd={() => setEditAddObjs(prev => [...prev, { id: Date.now(), name: `${t('common.object')} ${prev.length + 1}`, image: null }])}
                                onRemove={id => setEditAddObjs(prev => prev.filter(c => c.id !== id))}
                                onNameChange={(id, name) => setEditAddObjs(prev => prev.map(c => c.id === id ? { ...c, name } : c))}
                                onImageUpload={(id, image) => setEditAddObjs(prev => prev.map(c => c.id === id ? { ...c, image } : c))}
                                noun={t('common.object')}
                            />
                            <section>
                                <SectionHeader>{t('edit.instruction.title')}</SectionHeader>
                                <textarea
                                    value={standaloneEditPrompt} onChange={(e) => setStandaloneEditPrompt(e.target.value)}
                                    rows={4} className="w-full bg-black/30 border border-white/20 text-gray-200 rounded-lg shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-500 resize-y transition-all"
                                    placeholder={t('edit.instruction.placeholder')}/>
                            </section>
                        </MainPanel>

                        {/* Right Panel: Edit Output */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <MainPanel className="flex-grow flex flex-col min-h-[60vh]">
                                <div className="flex-grow p-2 min-h-0">
                                    <GeneratedImageDisplay 
                                        images={editedImage ? [editedImage] : []} 
                                        isLoading={editLoading} 
                                        error={editError}
                                        onView={setViewingImage}
                                    />
                                </div>
                            </MainPanel>
                            <div className="flex-shrink-0">
                                <button onClick={handleApplyStandaloneEdit} disabled={isEditDisabled} className="w-full py-4 px-6 text-xl font-bold text-black bg-fuchsia-500 rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.6)] hover:bg-fuchsia-400 hover:shadow-[0_0_25px_rgba(217,70,239,0.8)] disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-4 focus:ring-fuchsia-500/50 transition-all duration-300 transform hover:scale-105 disabled:transform-none">
                                    {editLoading ? t('edit.buttons.applying') : t('edit.buttons.apply')}
                                </button>
                                {editLoading && <ProgressBar />}
                            </div>
                        </div>
                    </>
                )}
            </main>

            <HistoryPanel isOpen={isHistoryPanelOpen} onClose={() => setIsHistoryPanelOpen(false)} history={history} onView={handleViewHistoryItem} onUseForEdit={handleUseForEdit} onDelete={handleDeleteFromHistory} onClear={handleClearHistory} />
            <Modal isOpen={viewingImage !== null} onClose={() => setViewingImage(null)} imageUrl={viewingImage}>
                {viewingImage && (
                    <img src={viewingImage} alt="Full view" className="max-w-full max-h-[90vh] object-contain rounded-lg"/>
                )}
            </Modal>
        </div>
    );
};

export default App;