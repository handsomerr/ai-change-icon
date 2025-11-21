import React, { useState, useCallback } from 'react';
import { AppStep, ImageAsset, NormalizedBox, BoundingBox } from './types';
import RegionSelector from './components/RegionSelector';
import StepIndicator from './components/StepIndicator';
import { fileToBase64, getMimeType } from './utils/imageUtils';
import { generatePatternSwap } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD_BASE);
  const [baseImage, setBaseImage] = useState<ImageAsset | null>(null);
  const [patternImage, setPatternImage] = useState<ImageAsset | null>(null);
  const [selectionBox, setSelectionBox] = useState<NormalizedBox | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Handlers ---

  const handleBaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        const mimeType = getMimeType(file);
        const previewUrl = URL.createObjectURL(file);
        setBaseImage({ file, base64, mimeType, previewUrl });
        setStep(AppStep.SELECT_REGION);
        setError(null);
      } catch (err) {
        setError("Failed to process base image.");
      }
    }
  };

  const handleRegionConfirmed = (pixelBox: BoundingBox, normalizedBox: NormalizedBox) => {
    setSelectionBox(normalizedBox);
    setStep(AppStep.UPLOAD_PATTERN);
  };

  const handlePatternImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        const mimeType = getMimeType(file);
        const previewUrl = URL.createObjectURL(file);
        const patternAsset = { file, base64, mimeType, previewUrl };
        setPatternImage(patternAsset);
        
        // Auto start processing after pattern upload
        await processSwap(patternAsset);
      } catch (err) {
        setError("Failed to process pattern image.");
      }
    }
  };

  const processSwap = async (patternAsset: ImageAsset) => {
    if (!baseImage || !selectionBox) return;

    setStep(AppStep.PROCESSING);
    setError(null);

    try {
      const generatedImageBase64 = await generatePatternSwap(
        baseImage.base64,
        baseImage.mimeType,
        patternAsset.base64,
        patternAsset.mimeType,
        selectionBox
      );
      setResultImage(generatedImageBase64);
      setStep(AppStep.RESULT);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong with the AI generation.");
      setStep(AppStep.UPLOAD_PATTERN); // Go back to pattern step
    }
  };

  const resetApp = () => {
    setStep(AppStep.UPLOAD_BASE);
    setBaseImage(null);
    setPatternImage(null);
    setSelectionBox(null);
    setResultImage(null);
    setError(null);
  };

  // --- Render Helpers ---

  const renderUploadStep = (title: string, subtitle: string, handler: (e: React.ChangeEvent<HTMLInputElement>) => void, id: string) => (
    <div className="flex flex-col items-center justify-center p-8 animate-fade-in w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">{title}</h2>
        <p className="text-zinc-400">{subtitle}</p>
      </div>

      <label 
        htmlFor={id} 
        className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-zinc-700 rounded-2xl cursor-pointer bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-indigo-500 transition-all duration-300"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="p-4 rounded-full bg-zinc-800 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors mb-4">
             <svg className="w-8 h-8 text-zinc-400 group-hover:text-indigo-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
          </div>
          <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-zinc-500">PNG, JPG or WebP</p>
        </div>
        <input id={id} type="file" className="hidden" accept="image/*" onChange={handler} />
      </label>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/30 rounded-full animate-ping"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Generating Swap</h3>
      <p className="text-zinc-400">Gemini is stitching your pattern...</p>
    </div>
  );

  const renderResult = () => (
    <div className="w-full max-w-6xl mx-auto p-4 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Transformation Complete</h2>
        <p className="text-zinc-400">Here is your AI-edited image</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Source Column */}
        <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Original</p>
                <img src={baseImage?.previewUrl} className="w-full h-auto rounded-lg" alt="Original" />
            </div>
             <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Pattern</p>
                <img src={patternImage?.previewUrl} className="w-full h-auto rounded-lg" alt="Pattern" />
            </div>
        </div>

        {/* Result Column */}
        <div className="md:col-span-2">
            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-700 shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Result</p>
                {resultImage && (
                    <img src={resultImage} className="w-full h-auto rounded-lg" alt="Result" />
                )}
            </div>
             <div className="flex justify-center mt-8 gap-4">
                <button onClick={resetApp} className="px-8 py-3 rounded-full bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors border border-zinc-700">
                    Start Over
                </button>
                <a href={resultImage || '#'} download="pattern-swap-result.png" className="px-8 py-3 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download
                </a>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                </div>
                <h1 className="text-xl font-bold tracking-tight">Pattern<span className="text-indigo-500">Swap</span> AI</h1>
            </div>
             <div className="text-xs text-zinc-500 font-mono">
                Powered by Gemini 2.5 Flash
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col pt-12 pb-12">
        <StepIndicator currentStep={step} />

        {error && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                {error}
            </div>
        )}

        <div className="flex-grow flex flex-col items-center">
            {step === AppStep.UPLOAD_BASE && renderUploadStep(
                "Upload Base Image", 
                "Start by uploading the photo of the object (e.g., a t-shirt) you want to edit.",
                handleBaseImageUpload,
                "base-upload"
            )}

            {step === AppStep.SELECT_REGION && baseImage && (
                <RegionSelector 
                    imageUrl={baseImage.previewUrl} 
                    onConfirm={handleRegionConfirmed}
                    onCancel={resetApp}
                />
            )}

            {step === AppStep.UPLOAD_PATTERN && renderUploadStep(
                "Upload Pattern",
                "Now, upload the image containing the new pattern or texture.",
                handlePatternImageUpload,
                "pattern-upload"
            )}

            {step === AppStep.PROCESSING && renderProcessing()}

            {step === AppStep.RESULT && renderResult()}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} PatternSwap AI. Built for demo purposes.</p>
      </footer>
    </div>
  );
};

export default App;
