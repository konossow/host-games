// Nazwa pliku bezpieczna dla Supabase Storage: "Dżem" -> "dzem", "Hall & Oates" -> "hall-oates"
export const slug = (name) => name
  .replace(/ł/g, 'l').replace(/Ł/g, 'L')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
