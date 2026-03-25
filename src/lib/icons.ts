import { File, FileAudio, FileCode2, FileImage, FileText, FileVideo } from 'lucide-react';

import { AUDIO_EXT, CODE_EXT, IMAGE_EXT, VIDEO_EXT } from '@/lib/constants';

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
