import React, { useRef, useState, useEffect, useCallback } from 'react';
import { BoundingBox, NormalizedBox } from '../types';

interface RegionSelectorProps {
  imageUrl: string;
  onConfirm: (pixelBox: BoundingBox, normalizedBox: NormalizedBox) => void;
  onCancel: () => void;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({ imageUrl, onConfirm, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [box, setBox] = useState<BoundingBox | null>(null);

  // Handle mouse down to start selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setBox({ x, y, width: 0, height: 0 });
    setIsDrawing(true);
  };

  // Handle mouse move to update selection
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - startPos.x;
    const height = currentY - startPos.y;

    setBox({
      x: width > 0 ? startPos.x : currentX,
      y: height > 0 ? startPos.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  // Handle mouse up to finish selection
  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Calculate normalized coordinates (0-1000) for Gemini
  const handleConfirm = () => {
    if (!box || !imageRef.current) return;

    // The displayed image dimensions might be different from intrinsic
    const displayedWidth = imageRef.current.width;
    const displayedHeight = imageRef.current.height;

    // Calculate ratio (0-1000)
    const normalizedBox: NormalizedBox = {
      ymin: Math.round((box.y / displayedHeight) * 1000),
      xmin: Math.round((box.x / displayedWidth) * 1000),
      ymax: Math.round(((box.y + box.height) / displayedHeight) * 1000),
      xmax: Math.round(((box.x + box.width) / displayedWidth) * 1000),
    };

    // Clamp values
    normalizedBox.ymin = Math.max(0, Math.min(1000, normalizedBox.ymin));
    normalizedBox.xmin = Math.max(0, Math.min(1000, normalizedBox.xmin));
    normalizedBox.ymax = Math.max(0, Math.min(1000, normalizedBox.ymax));
    normalizedBox.xmax = Math.max(0, Math.min(1000, normalizedBox.xmax));

    onConfirm(box, normalizedBox);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 animate-fade-in">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Select Target Area</h2>
        <p className="text-zinc-400 text-sm">Draw a box around the pattern/area you want to replace.</p>
      </div>

      <div 
        ref={containerRef}
        className="relative cursor-crosshair border-2 border-zinc-700 rounded-lg overflow-hidden shadow-2xl select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          ref={imageRef}
          src={imageUrl} 
          alt="Target" 
          className="max-h-[60vh] w-auto object-contain pointer-events-none block" 
          draggable={false}
        />
        
        {/* Overlay Box */}
        {box && (
          <div
            className="absolute border-2 border-indigo-500 bg-indigo-500/20 z-10"
            style={{
              left: box.x,
              top: box.y,
              width: box.width,
              height: box.height,
            }}
          >
            {/* Corner handles for visual flair */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-indigo-400 rounded-full" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-400 rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-400 rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-indigo-400 rounded-full" />
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-full border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!box || box.width < 10 || box.height < 10}
          className="px-6 py-2 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]"
        >
          Confirm Area
        </button>
      </div>
    </div>
  );
};

export default RegionSelector;
