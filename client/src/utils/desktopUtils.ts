/**
 * 桌面端工具函数
 */

/**
 * 检查是否在桌面端环境
 */
export const isDesktopEnvironment = (): boolean => {
  return typeof window !== 'undefined' && (window as any).isHexoProDesktop === true;
};

/**
 * 转换桌面端链接
 * 在桌面端环境中，将博客文章的链接域名转换为 localhost:4000
 * @param permalink 原始链接
 * @returns 转换后的链接
 */
export const convertDesktopLink = (permalink: string): string => {
  if (!permalink || !isDesktopEnvironment()) {
    return permalink;
  }

  try {
    // 如果是相对路径，直接构建完整的 localhost URL
    if (permalink.startsWith('/')) {
      return `http://localhost:4000${permalink}`;
    }

    // 如果是完整URL，解析并替换域名和端口
    const url = new URL(permalink);
    url.hostname = 'localhost';
    url.port = '4000';
    url.protocol = 'http:'; // 确保使用 HTTP 协议
    
    return url.toString();
  } catch (error) {
    console.warn('[Desktop Utils]: 转换链接失败，使用原始链接:', error, permalink);
    return permalink;
  }
};

/**
 * 打开链接（桌面端优化版本）
 * 在桌面端环境中会自动转换链接并使用外部浏览器打开
 * @param permalink 要打开的链接
 * @param target 打开方式，默认为 '_blank'
 */
export const openDesktopLink = (permalink: string, target: string = '_blank'): void => {
  if (!permalink) return;

  const convertedLink = convertDesktopLink(permalink);
  
  if (isDesktopEnvironment()) {
    // 在桌面端环境中，使用 electron 的 API 打开外部链接
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && electronAPI.openExternal) {
      electronAPI.openExternal(convertedLink);
    } else {
      // 如果 electron API 不可用，使用传统方式
      window.open(convertedLink, target);
    }
  } else {
    // 非桌面端环境，直接打开
    window.open(convertedLink, target);
  }
};

/**
 * 获取桌面端环境信息
 */
export const getDesktopEnvironmentInfo = () => {
  if (!isDesktopEnvironment()) {
    return null;
  }

  return {
    isDesktop: true,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    electronAPI: typeof (window as any).electronAPI !== 'undefined'
  };
}; 