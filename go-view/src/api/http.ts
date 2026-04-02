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
import { useTokenStore } from '@/store/modules/tokenStore/tokenStore'
import { replaceUrlParams } from '@/utils/urlParams'

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
 * * 自定义请求
 * @param targetParams 当前组件参数
 * @param globalParams 全局参数
 */
export const customizeHttp = (targetParams: RequestConfigType, globalParams: RequestGlobalConfigType) => {
  if (!targetParams || !globalParams) {
    return
  }
  // 全局
  const {
    // 全局请求源地址
    requestOriginUrl,
    // 全局请求内容
    requestParams: globalRequestParams
  } = globalParams

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

  // 调试日志
  console.log('[customizeHttp] Request URL:', requestUrl)
  console.log('[customizeHttp] Request Params:', targetRequestParams.Params)

  // 获取 Token Store 中的 Authorization
  const tokenStore = useTokenStore()
  const authorization = tokenStore.getAuthorization

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
  // 替换 params 中的 {{paramName}} 占位符
  const paramsStr = JSON.stringify(params)
  console.log('[customizeHttp] Params after translateStr:', paramsStr)
  params = JSON.parse(replaceUrlParams(paramsStr)) as RequestParamsObjType
  console.log('[customizeHttp] Params after replaceUrlParams:', params)
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
      if(typeof data === 'string')  data = JSON.parse(data)
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
      headers['Content-Type'] = ContentTypeEnum.FORM_DATA
      const bodyFormUrlencoded = targetRequestParams.Body['form-data']
      for (const i in bodyFormUrlencoded) {
        formData.set(i, translateStr(bodyFormUrlencoded[i]))
      }
      // FormData 赋值给 data
      data = formData
      break
    }
  }

  // sql 处理
  if (requestContentType === RequestContentTypeEnum.SQL) {
    headers['Content-Type'] = ContentTypeEnum.JSON
    data = requestSQLContent
  }

  try {
    // 组合完整 URL 并替换其中的 {{paramName}} 占位符
    const fullUrl = (requestOriginUrl + requestUrl).trim()
    console.log('[customizeHttp] Full URL before replace:', fullUrl)
    const processedUrl = replaceUrlParams(fullUrl)
    console.log('[customizeHttp] Full URL after replace:', processedUrl)
    const url = (new Function("return `" + processedUrl + "`"))();
    console.log('[customizeHttp] Final URL:', url)
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

