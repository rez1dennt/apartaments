// Apartment 1 is a presentation assignment, not a confirmed client number.
// Add confirmed per-unit facts here; the shared templates handle every record.
export const apartments = Array.from({ length: 15 }, (_, index) => ({
  id: index + 1,
  preview: index > 0,
  title: index === 0 ? { de: 'Licht, Raum und ein gutes Gefühl.', ru: 'Свет, простор и ощущение дома.' } : { de: 'Ihr Zuhause auf Zeit.', ru: 'Ваш дом на время поездки.' },
  description: index === 0 ? {
    de: 'Helle Wohnräume, ein gemütlicher Essbereich und eine eigene Küche. Ein unkomplizierter Ort zum Ankommen und Bleiben.',
    ru: 'Светлые комнаты, уютная обеденная зона и собственная кухня. Пространство, в котором легко устроиться и чувствовать себя дома.'
  } : {
    de: 'Ein vollständig ausgestattetes Apartment für kurze und längere Aufenthalte. Fotos und individuelle Details zu diesem Apartment folgen.',
    ru: 'Полностью оборудованный апартамент для коротких поездок и длительного проживания. Фотографии и индивидуальные характеристики появятся позже.'
  },
  guests: null, area: null, price: null,
  photos: index === 0 ? ['twin-room', 'kitchen', 'living-room', 'single-room', 'bathroom', 'bathroom-detail', 'hallway'] : []
}));
