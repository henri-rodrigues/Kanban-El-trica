/* Gradientes dos post-its — tons pastéis, suaves e pouco saturados */
export const POSTIT_GRADIENTS = [
  { id: 'cyan', name: 'Azul Sereno', gradient: 'linear-gradient(135deg, #6c96f5, #8fb4f8)', border: '#8fb4f8' },
  { id: 'sunset', name: 'Coral Suave', gradient: 'linear-gradient(135deg, #f2957e, #f0b38f)', border: '#f2957e' },
  { id: 'violet', name: 'Lavanda', gradient: 'linear-gradient(135deg, #9184ee, #b3a6f2)', border: '#b3a6f2' },
  { id: 'emerald', name: 'Verde Menta', gradient: 'linear-gradient(135deg, #3ec49b, #77d3ba)', border: '#3ec49b' },
  { id: 'amber', name: 'Âmbar Claro', gradient: 'linear-gradient(135deg, #edb45f, #f2cd8f)', border: '#edb45f' },
  { id: 'midnight', name: 'Cinza Ardósia', gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', border: '#94a3b8' }
];

export const getGradientById = (id) => {
  return POSTIT_GRADIENTS.find(g => g.id === id) || POSTIT_GRADIENTS[0];
};
