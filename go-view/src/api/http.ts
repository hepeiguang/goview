import axiosInstance from './axios'
import {
  RequestHttpEnum,
  ContentTypeEnum,
  RequestBodyEnum,
  RequestDataTypeEnum,
  RequestContentTypeEnum,
  RequestParamsObjType
} from '@/enums/httpEnum'
import type { RequestGlobalConfigType, RequestConfigType } from '@/store/modules/chartEditStore/chartEditStore.d'
import { replaceUrlParams, setGlobalParams } from '@/utils/urlParams'

/**
 * 递归替换对象中所有字符串值的占位符
 * 支持替换 headers、data、params 中的 {{paramName}} 占位符
 */
const replaceObjectParams = (obj: any): any => {
  if (typeof obj === 'string') {
    return replaceUrlParams(obj)
  }
  if (Array.isArray(obj)) {
    return obj.map(item => replaceObjectParams(item))
  }
  // 特殊处理 FormData
  if (obj instanceof FormData) {
    const newFormData = new FormData()
    obj.forEach((value, key) => {
      if (typeof value === 'string') {
        newFormData.append(key, replaceUrlParams(value))
      } else {
        newFormData.append(key, value)
      }
    })
    return newFormData
  }
  if (obj !== null && typeof obj === 'object') {
    const result: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = replaceObjectParams(obj[key])
      }
    }
    return result
  }
  return obj
}

export const get = <T = any>(url: string, params?: object) => {
  return axiosInstance<T>({
    url: url,
    method: RequestHttpEnum.GET,
    params: params,
  })
}

export const post = <T = any>(url: string, data?: object, headersType?: string) => {
  return axiosInstance<T>({
    url: url,
    method: RequestHttpEnum.POST,
    data: data,
    headers: {
      'Content-Type': headersType || ContentTypeEnum.JSON
    }
  })
}

export const patch = <T = any>(url: string, data?: object, headersType?: string) => {
  return axiosInstance<T>({
    url: url,
    method: RequestHttpEnum.PATCH,
    data: data,
    headers: {
      'Content-Type': headersType || ContentTypeEnum.JSON
    }
  })
}

export const put = <T = any>(url: string, data?: object, headersType?: ContentTypeEnum) => {
  return axiosInstance<T>({
    url: url,
    method: RequestHttpEnum.PUT,
    data: data,
    headers: {
      'Content-Type': headersType || ContentTypeEnum.JSON
    }
  })
}

export const del = <T = any>(url: string, params?: object) => {
  return axiosInstance<T>({
    url: url,
    method: RequestHttpEnum.DELETE,
    params
  })
}

// 获取请求函数，默认get
export const http = (type?: RequestHttpEnum) => {
  switch (type) {
    case RequestHttpEnum.GET:
      return get

    case RequestHttpEnum.POST:
      return post

    case RequestHttpEnum.PATCH:
      return patch

    case RequestHttpEnum.PUT:
      return put

    case RequestHttpEnum.DELETE:
      return del

    default:
      return get
  }
}
const prefix = 'javascript:'
// 对输入字符进行转义处理
export const translateStr = (target: string | Record<any, any>) => {
  if (typeof target === 'string') {
    if (target.startsWith(prefix)) {
      const funcStr = target.split(prefix)[1]
      let result
      try {
        result = new Function(`${funcStr}`)()
      } catch (error) {
        console.log(error)
        window['$message'].error('js内容解析有误！')
      }
      return result
    } else {
      return target
    }
  }
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      const subTarget = target[key]
      target[key] = translateStr(subTarget)
    }
  }
  return target
}

/**
 * 自定义请求
 * @param targetParams 当前组件参数
 * @param globalConfig 全局配置
 */
export const customizeHttp = (targetParams: RequestConfigType, globalConfig: RequestGlobalConfigType) => {
  if (!targetParams || !globalConfig) {
    return
  }
  // 全局
  const {
    // 全局请求源地址
    requestOriginUrl,
    // 全局请求内容
    requestParams: globalRequestParams,
    // 全局自定义参数（用于占位符替换）
    globalParams: customGlobalParams
  } = globalConfig

  // 设置全局自定义参数到 urlParams 模块
  if (customGlobalParams && Object.keys(customGlobalParams).length > 0) {
    setGlobalParams(customGlobalParams)
  }

  // 目标组件（优先级 > 全局组件）
  const {
    // 请求地址
    requestUrl,
    // 普通 / sql
    requestContentType,
    // 获取数据的方式
    requestDataType,
    // 请求方式 get/post/del/put/patch
    requestHttpType,
    // 请求体类型 none / form-data / x-www-form-urlencoded / json /xml
    requestParamsBodyType,
    // SQL 请求对象
    requestSQLContent,
    // 请求内容 params / cookie / header / body: 同 requestParamsBodyType
    requestParams: targetRequestParams
  } = targetParams

  // 静态排除
  if (requestDataType === RequestDataTypeEnum.STATIC) return

  if (!requestUrl) {
    return
  }

  // 处理头部
  let headers: RequestParamsObjType = {
    ...globalRequestParams.Header,
    ...targetRequestParams.Header
  }

  headers = translateStr(headers)

  // data 参数
  let data: RequestParamsObjType | FormData | string = {}
  // params 参数
  let params: RequestParamsObjType = { ...targetRequestParams.Params }
  params = translateStr(params)
  // 递归替换 params 中的 {{paramName}} 占位符
  params = replaceObjectParams(params)
  // form 类型处理
  let formData: FormData = new FormData()
  // 类型处理

  switch (requestParamsBodyType) {
    case RequestBodyEnum.NONE:
      break

    case RequestBodyEnum.JSON:
      headers['Content-Type'] = ContentTypeEnum.JSON
      //json对象也能使用'javasctipt:'来动态拼接参数
      data = translateStr(targetRequestParams.Body['json'])
      if (typeof data === 'string' && data.trim()) {
        try {
          data = JSON.parse(data)
        } catch (e) {
          console.error('JSON 解析错误:', e)
          window['$message'].error('JSON 格式错误，请检查输入内容')
        }
      }
      // json 赋值给 data
      break

    case RequestBodyEnum.XML:
      headers['Content-Type'] = ContentTypeEnum.XML
      // xml 字符串赋值给 data
      data = translateStr(targetRequestParams.Body['xml'])
      break

    case RequestBodyEnum.X_WWW_FORM_URLENCODED: {
      headers['Content-Type'] = ContentTypeEnum.FORM_URLENCODED
      const bodyFormData = targetRequestParams.Body['x-www-form-urlencoded']
      for (const i in bodyFormData) formData.set(i, translateStr(bodyFormData[i]))
      // FormData 赋值给 data
      data = formData
      break
    }

    case RequestBodyEnum.FORM_DATA: {
      // 注意：不要手动设置 Content-Type，让 axios 自动处理
      const bodyFormData = targetRequestParams.Body['form-data']
      for (const i in bodyFormData) {
        console.log(`FORM_DATA append: ${i} = ${bodyFormData[i]}`)
        const value = translateStr(bodyFormData[i])
        formData.append(i, value)
      }
      // FormData 赋值给 data
      data = formData
      // 打印 FormData 中所有参数
      console.log('[customizeHttp] FormData entries:')
      formData.forEach((value, key) => {
        console.log(`  ${key}: ${value}`)
      })
      break
    }
  }

  // sql 处理
  if (requestContentType === RequestContentTypeEnum.SQL) {
    headers['Content-Type'] = ContentTypeEnum.JSON
    const { key, sql } = requestSQLContent
    // 将 SQL 语句包装在外层 JSON 对象中
    const sqlKey = key?.trim() || 'sql'
    data = { [sqlKey]: sql }
    console.log('[customizeHttp] SQL data:', data)
  }

  try {
    // 递归替换 headers 中的占位符
    headers = replaceObjectParams(headers)
    // 递归替换 data 中的占位符
    data = replaceObjectParams(data)
    // 组合完整 URL 并替换其中的 {{paramName}} 占位符
    const fullUrl = (requestOriginUrl + requestUrl).trim()
    const processedUrl = replaceUrlParams(fullUrl)
    const url = (new Function("return `" + processedUrl + "`"))();
    return axiosInstance({
        url,
        method: requestHttpType,
        data,
        params,
        headers
    })
  } catch (error) {
    console.log(error)
    window['$message'].error('URL地址格式有误！')
  }
}
