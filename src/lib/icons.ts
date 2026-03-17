import { File, FileCode2, FileImage, FileText } from 'lucide-react';

export const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
export const CODE_EXT = ['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'scss', 'md', 'yml', 'yaml', 'py', 'go', 'rs', 'java', 'php', 'sql', 'sh', 'toml'];

export const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return File;
  if (IMAGE_EXT.includes(ext)) return FileImage;
  if (ext === 'md') return FileText;
  if (CODE_EXT.includes(ext)) return FileCode2;
  return File;
};
