export const colors = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  muted: '#8b949e',
  emerald: '#3fb950',
  amber: '#d29922',
  red: '#f85149',
  purple: '#a371f7',
} as const;

export type ColorName = keyof typeof colors;
