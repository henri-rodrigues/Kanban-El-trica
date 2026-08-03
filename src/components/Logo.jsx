import React from 'react';

/**
 * Renders the exact original 3D AR CONDICIONADO / ENGENHARIA TÉRMICA logo PNG image provided by the user.
 */
export const Logo3DCrystal = ({ size = 36, showText = true, textColor = 'var(--text-primary)' }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      <img 
        src="./logo.png" 
        alt="3D AR CONDICIONADO - ENGENHARIA TÉRMICA" 
        style={{ 
          height: typeof size === 'number' ? `${size}px` : size, 
          width: 'auto', 
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 2px 8px rgba(0, 163, 224, 0.3))'
        }} 
      />
    </div>
  );
};
