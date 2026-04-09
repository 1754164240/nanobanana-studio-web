/**
 * 获取应用的 basePath，用于 fetch 调用和静态资源路径
 * 在 Next.js 中，basePath 会自动应用于 Link 和 router，
 * 但 fetch() 和 <img src> 需要手动拼接
 */
export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * 给 API 路径添加 basePath 前缀
 * @example apiUrl('/api/config') => '/myapp/api/config'
 */
export function apiUrl(path: string): string {
  const base = getBasePath();
  return `${base}${path}`;
}

/**
 * 给静态资源路径添加 basePath 前缀
 * @example assetUrl('/bmc_qr.png') => '/myapp/bmc_qr.png'
 */
export function assetUrl(path: string): string {
  const base = getBasePath();
  return `${base}${path}`;
}
