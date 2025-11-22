import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
}

export const SciFiButton: React.FC<ButtonProps> = ({ children, variant = 'primary', icon, className, ...props }) => {
  const baseStyles = "relative overflow-hidden font-mono text-sm uppercase tracking-widest py-3 px-6 transition-all duration-300 clip-path-polygon";
  
  const variants = {
    primary: "bg-cyan-900/40 text-cyan-400 border border-cyan-400/50 hover:bg-cyan-400/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]",
    secondary: "bg-slate-900/60 text-slate-400 border border-slate-600 hover:bg-slate-800 hover:text-slate-200",
    danger: "bg-rose-900/40 text-rose-400 border border-rose-500/50 hover:bg-rose-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.5)]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className || ''}`}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {icon && <span>{icon}</span>}
        {children}
      </div>
      {/* Decorative corner markers */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-50"></div>
    </button>
  );
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}

export const SciFiSlider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, onChange }) => {
  return (
    <div className="flex flex-col gap-1 w-full max-w-xs backdrop-blur-sm bg-black/40 p-2 rounded border border-cyan-900/30">
      <div className="flex justify-between text-xs font-mono text-cyan-300">
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
      />
    </div>
  );
};
