// Pastel color mapping for students
export const PASTEL_COLORS = {
  'pastel-red': { bg: '#FFE4E1', text: '#C41E3A', border: '#FFB3A8' },
  'pastel-orange': { bg: '#FFE4CC', text: '#D97706', border: '#FFCCAA' },
  'pastel-yellow': { bg: '#FFFACD', text: '#B8860B', border: '#FFEB99' },
  'pastel-green': { bg: '#E0F7E0', text: '#2D5016', border: '#B3E5B3' },
  'pastel-blue': { bg: '#D6E9FF', text: '#003478', border: '#A3D5FF' },
  'pastel-purple': { bg: '#E8D5F2', text: '#4A148C', border: '#D4A5E0' },
  'pastel-pink': { bg: '#FFC0E0', text: '#88004B', border: '#FF99D0' },
  'pastel-gray': { bg: '#E8E8E8', text: '#4A4A4A', border: '#D0D0D0' },
};

// Legacy color mapping (for backwards compatibility if needed)
export const LEGACY_COLORS = {
  'red': { bg: '#FFE4E1', text: '#C41E3A', border: '#FFB3A8' },
  'orange': { bg: '#FFE4CC', text: '#D97706', border: '#FFCCAA' },
  'yellow': { bg: '#FFFACD', text: '#B8860B', border: '#FFEB99' },
  'green': { bg: '#E0F7E0', text: '#2D5016', border: '#B3E5B3' },
  'blue': { bg: '#D6E9FF', text: '#003478', border: '#A3D5FF' },
  'purple': { bg: '#E8D5F2', text: '#4A148C', border: '#D4A5E0' },
  'pink': { bg: '#FFC0E0', text: '#88004B', border: '#FF99D0' },
  'gray': { bg: '#E8E8E8', text: '#4A4A4A', border: '#D0D0D0' },
};

export const getColorForStudent = (colorTag) => {
  return PASTEL_COLORS[colorTag] || PASTEL_COLORS['pastel-gray'];
};