/**
 * URL 参数管理模块
 * 将 URL 参数存储到 sessionStorage，供组件配置请求引用
 * 支持 hash 路由模式下的参数获取
 * 支持手动设置全局参数
 */
import { StorageEnum } from '@/enums/storageEnum'

const { GO_URL_PARAMS } = StorageEnum

// URL 参数存储键名
export const URL_PARAMS_KEY = GO_URL_PARAMS

// 全局自定义参数（可手动设置）
let globalCustomParams: Record<string, string> = {}

/**
 * 从 URL（支持 hash 路由）提取所有参数
 * 兼容普通路由和 hash 路由两种模式：
 * - 普通路由: http://xxx.com/api/data?token=xxx
 * - Hash路由: http://xxx.com/#/chart/preview/xxx?token=xxx
 */
function parseUrlParams(): Record<string, string> {
  const params: Record<string, string> = {}
  const href = window.location.href

  // 尝试从 window.location.search 获取（普通路由）
  let queryString = window.location.search

  // 如果 search 为空，尝试从 hash 中获取参数（hash 路由）
  // hash 路由格式: http://xxx.com/#/path?query
  if (!queryString) {
    const hashIndex = href.indexOf('#')
    if (hashIndex !== -1) {
      const hashPart = href.substring(hashIndex + 1) // 去掉 #
      const queryIndex = hashPart.indexOf('?')
      if (queryIndex !== -1) {
        queryString = hashPart.substring(queryIndex)
      }
    }
  }

  if (queryString) {
    const urlParams = new URLSearchParams(queryString)
    urlParams.forEach((value, key) => {
      params[key] = value
    })
  }

  return params
}

/**
 * 从 URL 提取所有参数并存储到 sessionStorage
 */
export function extractAndStoreUrlParams(): Record<string, string> {
  const params: Record<string, string> = {}

  try {
    // 解析 URL 参数（支持 hash 路由）
    const parsedParams = parseUrlParams()
    Object.assign(params, parsedParams)

    if (Object.keys(params).length > 0) {
      sessionStorage.setItem(URL_PARAMS_KEY, JSON.stringify(params))
    }
  } catch (error) {
    console.error('[URL Params] Error extracting params:', error)
  }

  return params
}

/**
 * 获取所有可用的全局参数（URL参数 + 自定义参数）
 */
export function getUrlParams(): Record<string, string> {
  try {
    const stored = sessionStorage.getItem(URL_PARAMS_KEY)
    const urlParams = stored ? JSON.parse(stored) : {}
    // 合并 URL 参数和自定义参数，自定义参数优先级更高
    return { ...urlParams, ...globalCustomParams }
  } catch (error) {
    console.error('[URL Params] Error reading from sessionStorage:', error)
  }
  return { ...globalCustomParams }
}

/**
 * 设置全局自定义参数
 * 这些参数会与 URL 参数合并，优先级高于 URL 参数
 * @param params 参数对象
 */
export function setGlobalParams(params: Record<string, string>): void {
  globalCustomParams = { ...globalCustomParams, ...params }
  console.log('[URL Params] Global custom params set:', globalCustomParams)
}

/**
 * 设置单个全局参数
 * @param key 参数名
 * @param value 参数值
 */
export function setGlobalParam(key: string, value: string): void {
  globalCustomParams[key] = value
  console.log('[URL Params] Global param set:', key, '=', value)
}

/**
 * 获取全局自定义参数
 */
export function getGlobalParams(): Record<string, string> {
  return { ...globalCustomParams }
}

/**
 * 清除指定全局自定义参数
 * @param key 参数名，不传则清除所有
 */
export function clearGlobalParams(key?: string): void {
  if (key) {
    delete globalCustomParams[key]
  } else {
    globalCustomParams = {}
  }
}

/**
 * 获取单个 URL 参数
 * @param key 参数名
 */
export function getUrlParam(key: string): string | undefined {
  const params = getUrlParams()
  return params[key]
}

/**
 * 替换请求 URL 中的参数占位符
 * 支持格式: {{paramName}} 或 {{paramName:defaultValue}}
 * 如果参数不存在，用空字符串替换占位符
 * @param url 请求 URL
 * @param params 可选的参数覆盖
 */
export function replaceUrlParams(
  url: string,
  params?: Record<string, string>
): string {
  // 合并：外部参数 > 自定义全局参数 > URL参数
  const baseParams = getUrlParams()
  const mergedParams = params ? { ...baseParams, ...params } : baseParams

  // 替换 {{paramName}} 或 {{paramName:defaultValue}}
  const result = url.replace(/\{\{(\w+)(?::([^}]+))?\}\}/g, (match, key, defaultValue) => {
    // 优先级：合并参数 > 默认值 > 空字符串
    const replacement = mergedParams[key] || defaultValue || ''
    return replacement
  })

  return result
}

/**
 * 检查 URL 是否包含参数占位符
 * @param url 请求 URL
 */
export function hasUrlParams(url: string): boolean {
  return /\{\{.*?\}\}/.test(url)
}

/**
 * 获取 URL 中所有占位符的参数名
 * @param url 请求 URL
 */
export function getPlaceholderParams(url: string): string[] {
  const matches = url.match(/\{\{(\w+)(?::[^}]+)?\}\}/g) || []
  return matches.map(m => m.replace(/\{\{|\}\}/g, '').split(':')[0])
}

/**
 * 清除存储的 URL 参数
 */
export function clearUrlParams(): void {
  sessionStorage.removeItem(URL_PARAMS_KEY)
}

/**
 * 清除所有全局参数（包括 URL 参数和自定义参数）
 */
export function clearAllParams(): void {
  clearUrlParams()
  globalCustomParams = {}
}

/**
 * 将 URL 参数转换为请求头或查询参数格式
 * @param prefix 参数前缀，如 'X-' 用于请求头
 */
export function toRequestFormat(prefix?: string): Record<string, string> {
  const params = getUrlParams()
  const result: Record<string, string> = {}

  Object.entries(params).forEach(([key, value]) => {
    const formattedKey = prefix ? `${prefix}${key}` : key
    result[formattedKey] = value
  })

  return result
}

/**
 * 初始化 URL 参数（适用于页面加载时）
 * 从 URL 提取并存储，同时返回参数对象
 */
export function initUrlParams(): Record<string, string> {
  // 首先尝试从 URL 提取
  const params = extractAndStoreUrlParams()

  // 如果 URL 没有参数，尝试从 sessionStorage 读取（处理刷新场景）
  if (Object.keys(params).length === 0) {
    const stored = sessionStorage.getItem(URL_PARAMS_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return {}
      }
    }
  }

  return params
}
