import React from 'react';
import { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: AppStep.UPLOAD_BASE, label: 'Base Image', number: 1 },
    { id: AppStep.SELECT_REGION, label: 'Select Area', number: 2 },
    { id: AppStep.UPLOAD_PATTERN, label: 'New Pattern', number: 3 },
    { id: AppStep.RESULT, label: 'Result', number: 4 },
  ];

  // Logic to determine if processing is active (between 3 and 4 visually)
  const isProcessing = currentStep === AppStep.PROCESSING;
  
  const getStepStatus = (stepId: AppStep, index: number) => {
    const stepOrder = [AppStep.UPLOAD_BASE, AppStep.SELECT_REGION, AppStep.UPLOAD_PATTERN, AppStep.RESULT];
    const currentIndex = isProcessing ? 2 : stepOrder.indexOf(currentStep); // If processing, we are past step 3 but not at 4
    
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      <div className="flex items-center justify-between relative">
        {/* Connector Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-800 -z-10" />
        
        {steps.map((step, index) => {
          const status = getStepStatus(step.id, index);
          
          let circleClass = "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ";
          let textClass = "absolute -bottom-6 text-xs whitespace-nowrap font-medium transition-colors duration-300 ";

          if (status === 'completed') {
            circleClass += "bg-indigo-600 border-indigo-600 text-white";
            textClass += "text-indigo-400";
          } else if (status === 'current') {
            circleClass += "bg-zinc-900 border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]";
            textClass += "text-indigo-400";
          } else {
            circleClass += "bg-zinc-900 border-zinc-700 text-zinc-600";
            textClass += "text-zinc-600";
          }

          return (
            <div key={step.id} className="flex flex-col items-center relative group">
               <div className={circleClass}>
                 {status === 'completed' ? (
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                 ) : (
                   step.number
                 )}
               </div>
               <span className={textClass}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
