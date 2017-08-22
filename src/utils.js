import path from 'path';


export const log = console.log;

export function generatePortNumber() {
  const s = path.basename(process.cwd());
  if (s.length < 4) {
    return 3001;
  }
  const base = 2 * s.charCodeAt(1) + s.charCodeAt(2) + s.charCodeAt(s.length - 3) + s.charCodeAt(s.length - 1);
  return 3000 + base % 1000;
}

export function getHostName(port) {
  return `http://127.0.0.1:${port}/`;
}