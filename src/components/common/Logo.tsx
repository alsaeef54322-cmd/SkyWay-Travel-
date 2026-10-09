import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useSettings } from '../../context/SettingsContext.tsx';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  customName?: string;
  customLogoUrl?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  customName,
  customLogoUrl,
}) => {
  const { language } = useLanguage();
  const { settings, companyName, tagline } = useSettings();
  const [imgError, setImgError] = useState(false);

  const activeLogoUrl = customLogoUrl !== undefined ? customLogoUrl : settings.logoUrl;
  const activeCompanyName = customName || companyName;
  const activeTagline = tagline;

  const iconDimensions = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }[size];

  const titleSize = {
    sm: 'text-sm md:text-base',
    md: 'text-base md:text-lg',
    lg: 'text-xl md:text-2xl',
    xl: 'text-2xl md:text-3xl',
  }[size];

  // Helper for preset icons
  const renderPresetOrCustom = () => {
    if (activeLogoUrl && !imgError && !activeLogoUrl.startsWith('preset:')) {
      return (
        <div
          className={`${iconDimensions} rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center shrink-0 p-1`}
        >
          <img
            src={activeLogoUrl}
            alt={activeCompanyName}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      );
    }

    if (activeLogoUrl === 'preset:pyramids') {
      return (
        <div
          className={`${iconDimensions} rounded-xl bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] p-1 shadow-md flex items-center justify-center shrink-0 border border-amber-400/30`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full text-amber-400" fill="none">
            <path d="M6 32L20 10L34 32H6Z" stroke="#F59E0B" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M20 10L24 32" stroke="#FBBF24" strokeWidth="2" />
            <circle cx="20" cy="8" r="2" fill="#38BDF8" />
          </svg>
        </div>
      );
    }

    if (activeLogoUrl === 'preset:wings') {
      return (
        <div
          className={`${iconDimensions} rounded-xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#0284C7] p-1 shadow-md flex items-center justify-center shrink-0 border border-sky-400/40`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
            <path d="M8 26C14 18 24 14 34 16C26 22 20 26 14 30L8 26Z" fill="#38BDF8" />
            <path d="M6 22C12 14 22 10 32 12C24 18 18 22 12 26L6 22Z" fill="#93C5FD" />
            <circle cx="34" cy="16" r="2.5" fill="#F59E0B" />
          </svg>
        </div>
      );
    }

    if (activeLogoUrl === 'preset:globe') {
      return (
        <div
          className={`${iconDimensions} rounded-xl bg-gradient-to-br from-[#064E3B] via-[#047857] to-[#10B981] p-1 shadow-md flex items-center justify-center shrink-0 border border-emerald-400/40`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full text-white" fill="none">
            <circle cx="20" cy="20" r="14" stroke="#FFFFFF" strokeWidth="2.2" />
            <ellipse cx="20" cy="20" rx="7" ry="14" stroke="#A7F3D0" strokeWidth="1.8" />
            <path d="M6 20H34" stroke="#FDE047" strokeWidth="1.8" />
          </svg>
        </div>
      );
    }

    // Default SkyWay Dynamic Brand Icon
    return (
      <div
        className={`${iconDimensions} rounded-xl bg-gradient-to-br from-[#0B1730] via-[#123B67] to-[#38A7E8] p-0.5 shadow-md flex items-center justify-center shrink-0 border border-sky-400/30`}
      >
        <svg viewBox="0 0 40 40" className="w-full h-full text-white p-1" fill="none">
          {/* Flight Path Arc */}
          <path
            d="M8 32C12 20 22 10 34 8"
            stroke="url(#skyGoldGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="2 3"
          />
          {/* Stylized Jet / Wing Icon */}
          <path
            d="M14 26L24 14L32 16L27 21L33 27L29 28L23 23L18 28L14 26Z"
            fill="white"
            className="drop-shadow-sm"
          />
          {/* Compass / Star Accent */}
          <circle cx="34" cy="8" r="2.5" fill="#F59E0B" />
          <defs>
            <linearGradient id="skyGoldGrad" x1="8" y1="32" x2="34" y2="8" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38A7E8" />
              <stop offset="0.6" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon or Custom Uploaded Logo */}
      {renderPresetOrCustom()}

      <div className="flex flex-col">
        <div
          className={`font-bold tracking-tight text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 ${titleSize}`}
        >
          <span className="truncate max-w-[280px] sm:max-w-[360px]">{activeCompanyName}</span>
          <span className="text-sky-500 font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 tracking-wider shrink-0">
            TRAVEL
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[280px]">
            {activeTagline}
          </span>
        )}
      </div>
    </div>
  );
};
