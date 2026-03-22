import { File, FileAudio, FileCode2, FileImage, FileText, FileVideo } from 'lucide-react';

export const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
export const CODE_EXT = ['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'scss', 'md', 'yml', 'yaml', 'py', 'go', 'rs', 'java', 'php', 'sql', 'sh', 'toml'];
export const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
export const VIDEO_EXT = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

export const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return File;
  if (IMAGE_EXT.includes(ext)) return FileImage;
  if (AUDIO_EXT.includes(ext)) return FileAudio;
  if (VIDEO_EXT.includes(ext)) return FileVideo;
  if (ext === 'md') return FileText;
  if (CODE_EXT.includes(ext)) return FileCode2;
  return File;
};
