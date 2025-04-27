/**
 * 字符串编码工具集
 */

/**
 * Base64 编码字符串
 * @param str 要编码的字符串
 * @returns Base64 编码后的字符串
 */
export function base64Encode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)))
}

/**
 * Base64 解码字符串
 * @param str Base64 编码的字符串
 * @returns 解码后的原始字符串
 */
export function base64Decode(str: string): string {
    return decodeURIComponent(escape(atob(str)))
}