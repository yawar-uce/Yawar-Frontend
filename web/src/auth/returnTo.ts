const KEY = 'yawar.returnTo';

export function saveReturnTo(path: string): void {
  sessionStorage.setItem(KEY, path);
}

/** Where to go after the login redirect. Only paths inside this app are accepted. */
export function readReturnTo(): string {
  const path = sessionStorage.getItem(KEY);
  const isLocal = path?.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
  return path && isLocal && !path.startsWith('/callback') ? path : '/';
}
