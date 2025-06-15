/**
 * 布尔值转换工具函数
 */

/**
 * 判断一个值是否为布尔类型的字符串
 * @param value 要检查的值
 * @returns 如果是布尔类型字符串返回 true，否则返回 false
 */
export function isBooleanString(value: any): boolean {
    if (typeof value !== 'string') {
        return false
    }
    
    const lowerValue = value.toLowerCase().trim()
    const truthy = ['true', 'yes', '1', 'on', 'enabled', 'active']
    const falsy = ['false', 'no', '0', 'off', 'disabled', 'inactive']
    
    return truthy.includes(lowerValue) || falsy.includes(lowerValue)
}

/**
 * 将布尔类型字符串转换为布尔值
 * @param value 要转换的值
 * @returns 转换后的布尔值，如果不是布尔类型字符串则返回原值
 */
export function convertBooleanString(value: any): any {
    if (!isBooleanString(value)) {
        return value
    }
    
    const lowerValue = value.toLowerCase().trim()
    const truthy = ['true', 'yes', '1', 'on', 'enabled', 'active']
    
    return truthy.includes(lowerValue)
}

/**
 * 处理 frontMatter 对象，将其中的布尔类型字符串转换为布尔值
 * @param frontMatter frontMatter 对象
 * @returns 处理后的 frontMatter 对象
 */
export function processFrontMatterBooleans(frontMatter: Record<string, any>): Record<string, any> {
    const processed = {}
    
    Object.keys(frontMatter).forEach(key => {
        processed[key] = convertBooleanString(frontMatter[key])
    })
    
    return processed
}

/**
 * 格式化 frontMatter 值用于显示
 * @param value frontMatter 的值
 * @returns 格式化后的显示字符串
 */
export function formatFrontMatterValue(value: any): string {
    // 如果值为 null 或 undefined，显示 'unset'
    if (value === null || value === undefined) {
        return 'unset'
    }
    
    // 如果值为空字符串，显示 'empty'
    if (value === '') {
        return 'empty'
    }
    
    // 如果值为布尔类型，转换为字符串
    if (typeof value === 'boolean') {
        return value.toString()
    }
    
    // 其他情况直接转换为字符串
    return String(value)
} 