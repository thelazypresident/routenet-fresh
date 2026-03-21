import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function System() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToDashboard = () => {
    const targetPath = createPageUrl('Dashboard');
    if (location.pathname === targetPath) return;
    navigate(targetPath);
  };

  return (
    <div className="min-h-screen pb-20 page-container">
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        <div className="rounded-2xl card-dark p-6 text-center">
          <Settings2 className="w-12 h-12 mx-auto mb-4 text-[#66BB6A]" />
          <h1 className="text-xl font-bold text-white mb-2">
            System
          </h1>
          <p className="text-sm text-white/70 mb-6">
            System tools and diagnostics.
          </p>

          <button
            type="button"
            onClick={goToDashboard}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] px-4 py-2 text-sm font-bold text-black"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}