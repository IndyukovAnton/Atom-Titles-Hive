
export interface BackgroundOption {
  id: string;
  name: string;
  preview: string;
  className: string;
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'default',
    name: 'По умолчанию',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    className: 'bg-gradient-to-br from-purple-600 to-purple-900',
  },
  {
    id: 'liquid-ether',
    name: 'Liquid Ether',
    preview: 'linear-gradient(135deg, #00d2ff 0%, #3a47d5 100%)',
    className: 'bg-gradient-to-br from-cyan-500 to-blue-800',
  },
  {
    id: 'light-pillar',
    name: 'Light Pillar',
    preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    className: 'bg-gradient-to-br from-pink-400 to-red-500',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    className: 'bg-gradient-to-br from-blue-400 to-cyan-400',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    className: 'bg-gradient-to-br from-pink-500 to-yellow-400',
  },
  {
    id: 'forest',
    name: 'Forest',
    preview: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    className: 'bg-gradient-to-br from-green-700 to-emerald-500',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    preview: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    className: 'bg-gradient-to-br from-slate-800 to-blue-700',
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    preview: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
    className: 'bg-gradient-to-br from-purple-700 to-indigo-900',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    preview: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    className: 'bg-gradient-to-br from-blue-700 to-cyan-300',
  },
  {
    id: 'passion',
    name: 'Passion',
    preview: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
    className: 'bg-gradient-to-br from-pink-600 to-orange-500',
  },
];
