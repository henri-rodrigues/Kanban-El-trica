export const POSTIT_GRADIENTS = [
  { id: 'cyan', name: 'Electric Cyan', gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)', border: '#38bdf8' },
  { id: 'sunset', name: 'Sunset Flame', gradient: 'linear-gradient(135deg, #f97316, #e11d48)', border: '#f97316' },
  { id: 'violet', name: 'Cosmic Violet', gradient: 'linear-gradient(135deg, #6366f1, #a855f7)', border: '#a855f7' },
  { id: 'emerald', name: 'Emerald Wave', gradient: 'linear-gradient(135deg, #10b981, #059669)', border: '#10b981' },
  { id: 'amber', name: 'Amber Glow', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', border: '#f59e0b' },
  { id: 'midnight', name: 'Midnight Dark', gradient: 'linear-gradient(135deg, #334155, #1e293b)', border: '#475569' }
];

export const getGradientById = (id) => {
  return POSTIT_GRADIENTS.find(g => g.id === id) || POSTIT_GRADIENTS[0];
};
