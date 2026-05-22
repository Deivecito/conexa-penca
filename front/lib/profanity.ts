// Términos bloqueados en español rioplatense e inglés.
// Se normalizan acentos y caracteres especiales antes de comparar.
const BLOCKED = [
  // Español – River Plate
  'puta', 'puto', 'putita', 'hdp', 'hdlp', 'hijo de puta',
  'concha', 'conchuda', 'conchetumare',
  'coño', 'coñazo',
  'verga', 'vergudo',
  'pija', 'pijudo',
  'chota', 'chotudo',
  'boludo', 'boluda', 'pelotudo', 'pelotuda',
  'forro', 'forra',
  'marica', 'maricon',
  'culero', 'culera',
  'mierda',
  'culo',
  // Inglés
  'fuck', 'fucker', 'fucking',
  'shit',
  'cunt',
  'nigger', 'nigga',
  'faggot', 'fag',
  'whore',
  'slut',
  'bitch',
  // Odio / nazi
  'nazi',
  'hitler',
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9]/g, '')       // solo alfanumérico
}

export function containsProfanity(text: string): boolean {
  const n = normalize(text)
  return BLOCKED.some(word => n.includes(normalize(word)))
}
