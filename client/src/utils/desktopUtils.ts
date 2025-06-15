/**
 * 桌面端工具函数
 */

// 链接重定向设置接口
interface LinkRedirectSettings {
  enabled: boolean;
  domain: string;
}

/**
 * 检查是否在桌面端环境
 */
export const isDesktopEnvironment = (): boolean => {
  return typeof window !== 'undefined' && (window as any).isHexoProDesktop === true;
};

/**
 * 获取链接重定向设置
 */
export const getLinkRedirectSettings = (): LinkRedirectSettings => {
  if (typeof window === 'undefined') {
    return { enabled: false, domain: 'http://localhost:4000' };
  }

  const enabled = localStorage.getItem('hexoProLinkRedirectEnabled') === 'true';
  const domain = localStorage.getItem('hexoProCustomDomain') || 'http://localhost:4000';
  
  return { enabled, domain };
};

/**
 * 检查是否应该进行链接转换
 * 支持两种模式：
 * 1. 桌面端自动模式：在桌面端环境中自动转换
 * 2. 用户设置模式：根据用户设置决定是否转换
 */
export const shouldConvertLink = (): boolean => {
  const settings = getLinkRedirectSettings();
  
  // 如果用户明确启用了链接重定向，则转换
  if (settings.enabled) {
    return true;
  }
  
  // 如果用户没有启用，但在桌面端环境中，也进行转换（向后兼容）
  return isDesktopEnvironment();
};

/**
 * 转换桌面端链接
 * 根据用户设置或桌面端环境，将博客文章的链接域名转换为自定义域名
 * @param permalink 原始链接
 * @returns 转换后的链接
 */
export const convertDesktopLink = (permalink: string): string => {
  if (!permalink || !shouldConvertLink()) {
    return permalink;
  }

  const settings = getLinkRedirectSettings();
  const targetDomain = settings.enabled ? settings.domain : 'http://localhost:4000';

  try {
    // 解析目标域名
    const targetUrl = new URL(targetDomain);
    
    // 如果是相对路径，直接构建完整的目标URL
    if (permalink.startsWith('/')) {
      return `${targetUrl.protocol}//${targetUrl.host}${permalink}`;
    }

    // 如果是完整URL，解析并替换域名和端口
    const originalUrl = new URL(permalink);
    originalUrl.protocol = targetUrl.protocol;
    originalUrl.hostname = targetUrl.hostname;
    originalUrl.port = targetUrl.port;
    
    return originalUrl.toString();
  } catch (error) {
    console.warn('[Desktop Utils]: 转换链接失败，使用原始链接:', error, permalink);
    return permalink;
  }
};

/**
 * 打开链接（桌面端优化版本）
 * 根据用户设置或桌面端环境，自动转换链接并打开
 * @param permalink 要打开的链接
 * @param target 打开方式，默认为 '_blank'
 */
export const openDesktopLink = (permalink: string, target: string = '_blank'): void => {
  if (!permalink) return;

  const convertedLink = convertDesktopLink(permalink);
  
  // 在桌面端环境中，优先使用 electron API
  if (isDesktopEnvironment()) {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && electronAPI.openExternal) {
      electronAPI.openExternal(convertedLink);
      return;
    }
  }
  
  // 使用传统方式打开链接
  window.open(convertedLink, target);
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

/**
 * 监听链接重定向设置变化
 * @param callback 设置变化时的回调函数
 * @returns 取消监听的函数
 */
export const onLinkSettingsChange = (callback: (settings: LinkRedirectSettings) => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleSettingsChange = (event: CustomEvent) => {
    callback(event.detail);
  };

  // 监听自定义事件
  window.addEventListener('hexoProLinkSettingsChanged', handleSettingsChange as EventListener);

  // 返回清理函数
  return () => {
    window.removeEventListener('hexoProLinkSettingsChanged', handleSettingsChange as EventListener);
  };
};

/**
 * 批量更新链接重定向设置
 * @param enabled 是否启用链接重定向
 * @param domain 自定义域名
 */
export const updateLinkRedirectSettings = (enabled: boolean, domain: string): void => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('hexoProLinkRedirectEnabled', enabled.toString());
  localStorage.setItem('hexoProCustomDomain', domain);

  // 触发自定义事件，通知其他组件设置已更新
  window.dispatchEvent(new CustomEvent('hexoProLinkSettingsChanged', {
    detail: { enabled, domain }
  }));
}; 