export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';

export function inferMediaType(url: string): MediaType {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.match(/\.(mp3|wav|ogg|aac|m4a|weba)$/)) return 'AUDIO';
  if (clean.match(/\.(mp4|webm|ogv|mov)$/)) return 'VIDEO';
  return 'IMAGE';
}

