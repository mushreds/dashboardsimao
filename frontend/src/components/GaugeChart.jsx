import React from 'react';

const GaugeChart = ({ value, max, label, prefix = '', formatType = 'number' }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference / 2;
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

  const formatValue = (val) => {
    if (formatType === 'money') {
      if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(2).replace('.', ',')}M`;
      if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}K`;
      return `R$ ${val.toLocaleString('pt-BR')}`;
    }
    return val.toLocaleString('pt-BR');
  };

  const getDisplayValue = () => {
    if (formatType === 'percent') return `${percentage.toFixed(1)}%`;
    return formatValue(value);
  };

  const getDisplayMax = () => {
    if (formatType === 'money') {
      if (max >= 1000000) return `R$ ${(max / 1000000).toFixed(1).replace('.', ',')}M`;
      return `R$ ${(max / 1000).toFixed(0)}K`;
    }
    return max.toLocaleString('pt-BR');
  };

  return (
    <div className="flex flex-col items-center justify-between bg-[#14171B] border border-[#24282F] rounded-2xl p-4 w-48 h-32 relative shadow-lg">
      <span className="text-[9px] font-black text-text-secondary tracking-widest uppercase mb-1">{label}</span>
      <div className="w-full relative flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
          <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#1D2127" strokeWidth="8" strokeLinecap="round" />
          <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="url(#brandGoldGradient)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={arcLength} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
          <defs>
            <linearGradient id="brandGoldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2A2115" />
              <stop offset="50%" stopColor="#817566" />
              <stop offset="100%" stopColor="#FFF3E3" />
            </linearGradient>
          </defs>
          <text x="50" y="48" textAnchor="middle" fill="#F6F7F7" fontSize="10" fontWeight="bold">
            {getDisplayValue()}
          </text>
        </svg>
      </div>
      <div className="flex justify-between w-full text-[9px] font-bold text-text-muted px-2 mono-numbers">
        <span>0</span>
        <span>{prefix}{getDisplayMax()}</span>
      </div>
    </div>
  );
};

export default GaugeChart;
