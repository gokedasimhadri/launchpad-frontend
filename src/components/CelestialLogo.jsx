import React from 'react';
import GoldLogo from './GoldLogo';
import LightLogo from './LightLogo';
import './CelestialLogo.css';

export default function CelestialLogo({ theme = 'light' }) {
  return (
    <div className="sdg-interactive-wrap">
      {theme === 'dark' ? (
        <GoldLogo className="sdg-gold-logo theme-dark-logo" />
      ) : (
        <LightLogo className="sdg-gold-logo theme-light-logo" />
      )}
    </div>
  );
}
