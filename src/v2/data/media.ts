export interface MediaAsset {
  src: string;
  webm: string;
  poster: string;
  width: number;
  height: number;
}

const base = import.meta.env.BASE_URL || './';
const prefix = base.endsWith('/') ? base : `${base}/`;

export const HERO_MEDIA: MediaAsset = {
  src: `${prefix}v2/media/hero.mp4`,
  webm: `${prefix}v2/media/hero.webm`,
  poster: `${prefix}v2/media/hero-poster.webp`,
  width: 1920,
  height: 1080,
};

export const BENTO_MEDIA: MediaAsset = {
  src: `${prefix}v2/media/bento.mp4`,
  webm: `${prefix}v2/media/bento.webm`,
  poster: `${prefix}v2/media/bento-poster.webp`,
  width: 1280,
  height: 720,
};
