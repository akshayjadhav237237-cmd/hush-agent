export interface MediaAsset {
  src: string;
  webm: string;
  poster: string;
  width: number;
  height: number;
}

export const HERO_MEDIA: MediaAsset = {
  src: './v2/media/hero.mp4',
  webm: './v2/media/hero.webm',
  poster: './v2/media/hero-poster.webp',
  width: 1920,
  height: 1080,
};

export const BENTO_MEDIA: MediaAsset = {
  src: './v2/media/bento.mp4',
  webm: './v2/media/bento.webm',
  poster: './v2/media/bento-poster.webp',
  width: 1280,
  height: 720,
};
