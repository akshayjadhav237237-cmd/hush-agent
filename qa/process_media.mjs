import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const root = path.resolve('.');
const mediaDir = path.join(root, 'public', 'v2', 'media');
const tmpDir = path.join(root, 'tmp_media');

if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const HERO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4';
const BENTO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4';

async function downloadFile(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000000) {
    console.log(`Already downloaded: ${dest}`);
    return;
  }
  console.log(`Downloading ${url} -> ${dest}`);
  const file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${dest} (${fs.statSync(dest).size} bytes)`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function run() {
  const heroRaw = path.join(tmpDir, 'hero_raw.mp4');
  const bentoRaw = path.join(tmpDir, 'bento_raw.mp4');

  await downloadFile(HERO_URL, heroRaw);
  await downloadFile(BENTO_URL, bentoRaw);

  const heroMp4 = path.join(mediaDir, 'hero.mp4');
  const heroWebm = path.join(mediaDir, 'hero.webm');
  const heroPoster = path.join(mediaDir, 'hero-poster.webp');

  console.log('Transcoding Hero MP4 (1080p, 24fps, <= 6MB)...');
  execSync(`ffmpeg -y -i "${heroRaw}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -r 24 -an -c:v libx264 -crf 28 -preset fast -movflags +faststart "${heroMp4}"`, { stdio: 'inherit' });

  console.log('Transcoding Hero WebM (1080p, 24fps)...');
  execSync(`ffmpeg -y -i "${heroRaw}" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -r 24 -an -c:v libvpx-vp9 -b:v 1000k -crf 35 -row-mt 1 -threads 8 -cpu-used 4 -deadline good "${heroWebm}"`, { stdio: 'inherit' });

  console.log('Generating Hero poster...');
  execSync(`ffmpeg -y -ss 00:00:01 -i "${heroRaw}" -vframes 1 -q:v 2 "${heroPoster}"`, { stdio: 'inherit' });

  const bentoMp4 = path.join(mediaDir, 'bento.mp4');
  const bentoWebm = path.join(mediaDir, 'bento.webm');
  const bentoPoster = path.join(mediaDir, 'bento-poster.webp');

  console.log('Transcoding Bento MP4 (720p, 24fps, <= 3MB)...');
  execSync(`ffmpeg -y -i "${bentoRaw}" -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -r 24 -an -c:v libx264 -crf 29 -preset fast -movflags +faststart "${bentoMp4}"`, { stdio: 'inherit' });

  console.log('Transcoding Bento WebM (720p, 24fps)...');
  execSync(`ffmpeg -y -i "${bentoRaw}" -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -r 24 -an -c:v libvpx-vp9 -b:v 600k -crf 38 -row-mt 1 -threads 8 -cpu-used 4 -deadline good "${bentoWebm}"`, { stdio: 'inherit' });

  console.log('Generating Bento poster...');
  execSync(`ffmpeg -y -ss 00:00:01 -i "${bentoRaw}" -vframes 1 -q:v 2 "${bentoPoster}"`, { stdio: 'inherit' });

  console.log('Hero MP4 size:', (fs.statSync(heroMp4).size / (1024 * 1024)).toFixed(2), 'MB');
  console.log('Hero WebM size:', (fs.statSync(heroWebm).size / (1024 * 1024)).toFixed(2), 'MB');
  console.log('Bento MP4 size:', (fs.statSync(bentoMp4).size / (1024 * 1024)).toFixed(2), 'MB');
  console.log('Bento WebM size:', (fs.statSync(bentoWebm).size / (1024 * 1024)).toFixed(2), 'MB');

  // Clean tmp
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('All media processing complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
