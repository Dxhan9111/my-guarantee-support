import React from 'react';

// --- Card ---
// Clean, modern glass card
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`glass-panel rounded-2xl overflow-hidden transition-all ${className}`}>
    {title && (
      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/5">
        <h3 className="font-bold text-lg text-white tracking-wide flex items-center gap-2">
          {title}
        </h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// --- Button ---
// Lively, pop-out buttons with distinct styles
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', isLoading, ...props }) => {
  // Base: Pill shape, bold font, smooth transition for scale
  const baseStyle = "relative inline-flex items-center justify-center rounded-full font-bold tracking-wide outline-none transition-all duration-300 ease-out transform active:scale-95 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg";
  
  // Variants: Using gradients for "pop"
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-indigo-500/40 hover:scale-105 border border-transparent",
    secondary: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-cyan-500/40 hover:scale-105 border border-transparent",
    outline: "bg-transparent border-2 border-slate-600 text-slate-300 hover:border-white hover:text-white hover:bg-white/5",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/10 shadow-none hover:shadow-none hover:scale-105",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-red-500/40 hover:scale-105 border border-transparent",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  );
};

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'info' | 'error' | 'default'; className?: string }> = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: "bg-slate-700/50 text-slate-300 ring-1 ring-slate-600",
    success: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50",
    warning: "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50",
    info: "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50",
    error: "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-md ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">{label}</label>}
    <div className="relative">
      <input
        className={`block w-full bg-slate-800/50 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-400 ml-1">{error}</p>}
  </div>
);

// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom glass-panel rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-white/10">
          <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="text-lg font-bold text-white">
               {title}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/20 rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-6">
            {children}
          </div>
          <div className="bg-slate-900/50 px-6 py-4 flex justify-end gap-3">
             <Button variant="ghost" onClick={onClose}>取消</Button>
          </div>
        </div>
      </div>
    </div>
  );
};