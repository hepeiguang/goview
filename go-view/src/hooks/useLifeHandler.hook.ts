import { CreateComponentType, CreateComponentGroupType } from '@/packages/index.d'
import { EventLife } from '@/enums/eventEnum'
import * as echarts from 'echarts'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import {
  setGlobalParam,
  setGlobalParams,
  getGlobalParams,
  clearGlobalParams,
  getUrlParam,
  getPlaceholderParams,
  hasUrlParams
} from '@/utils/urlParams'

// 所有图表组件集合对象（Vue 实例）
const components: { [K in string]?: any } = {}

// 组件配置数据映射表（用于事件中访问和修改）
const componentConfigs: { [K in string]?: CreateComponentType } = {}

// 项目提供的npm 包变量
export const npmPkgs = { echarts }

/**
 * 注册组件配置（供事件处理使用）
 */
export function registerComponentConfig(id: string, config: CreateComponentType) {
  componentConfigs[id] = config
}

/**
 * 获取组件配置
 */
export function getComponentConfig(id: string): CreateComponentType | undefined {
  return componentConfigs[id]
}

/**
 * 获取所有组件配置
 */
export function getAllComponentConfigs(): { [K in string]?: CreateComponentType } {
  return componentConfigs
}

/**
 * 从 store 中查找组件（获取 Pinia 响应式代理对象）
 */
function findComponentInStore(componentId: string): CreateComponentType | undefined {
  try {
    const chartEditStore = useChartEditStore()
    const list = chartEditStore.getComponentList
    console.log('[findComponentInStore] Store found, list length:', list?.length)
    for (const item of list) {
      if (item.id === componentId && !item.isGroup) {
        console.log('[findComponentInStore] Found in store:', componentId)
        return item as CreateComponentType
      }
      if (item.isGroup) {
        const group = item as CreateComponentGroupType
        for (const child of group.groupList) {
          if (child.id === componentId) {
            console.log('[findComponentInStore] Found in group:', componentId)
            return child as CreateComponentType
          }
        }
      }
    }
    console.log('[findComponentInStore] NOT found in store:', componentId)
  } catch (e) {
    console.error('[findComponentInStore] Error:', e)
  }
  return undefined
}
// 防抖记录（避免短时间内多次触发）
const triggerDebounceMap = new Map<string, number>()

/**
 * 触发组件重新请求（防抖版）
 * @param componentId 组件ID
 * @param params 要修改的 Params 参数 { key: value }
 * @param body 要修改的 Body 参数（用于 form-data/x-www-form-urlencoded/json 等）
 * @param header 要修改的 Header 参数
 */
export function triggerComponentRequest(
  componentId: string,
  params?: Record<string, any>,
  body?: Record<string, any>,
  header?: Record<string, any>
) {
  // 防抖：100ms 内只触发第一次
  const now = Date.now()
  const lastTrigger = triggerDebounceMap.get(componentId)
  if (lastTrigger && now - lastTrigger < 100) {
    console.log('[triggerComponentRequest] Debounced:', componentId)
    return false
  }
  triggerDebounceMap.set(componentId, now)

  console.log('[triggerComponentRequest] === START ===', componentId)
  console.log('[triggerComponentRequest] params:', params)
  console.log('[triggerComponentRequest] body:', body)
  console.log('[triggerComponentRequest] header:', header)

  // 从 store 获取响应式组件
  const config = findComponentInStore(componentId)
  if (!config) {
    console.error(`[triggerComponentRequest] Component not found in store: ${componentId}`)
    return false
  }

  console.log('[triggerComponentRequest] config pointer:', config)
  console.log('[triggerComponentRequest] Before Params:', JSON.stringify(config.request?.requestParams?.Params))

  // 构建新的 requestParams
  const newRequestParams: any = {
    ...config.request.requestParams,
    Params: {
      ...config.request.requestParams.Params,
      _trigger: String(Date.now())
    }
  }

  // 合并 params
  if (params) {
    newRequestParams.Params = {
      ...newRequestParams.Params,
      ...params
    }
  }

  // 合并 header
  if (header) {
    newRequestParams.Header = {
      ...config.request.requestParams.Header,
      ...header
    }
  }

  // 合并 body（form-data 或 x-www-form-urlencoded）
  if (body) {
    const currentBody = config.request.requestParams.Body
    // 尝试合并 form-data 和 x-www-form-urlencoded
    if (currentBody['form-data']) {
      newRequestParams.Body = {
        ...currentBody,
        'form-data': {
          ...currentBody['form-data'],
          ...body
        }
      }
    } else if (currentBody['x-www-form-urlencoded']) {
      newRequestParams.Body = {
        ...currentBody,
        'x-www-form-urlencoded': {
          ...currentBody['x-www-form-urlencoded'],
          ...body
        }
      }
    } else {
      // 对于 json 或其他类型，直接替换
      newRequestParams.Body = {
        ...currentBody,
        ...body
      }
    }
  }

  config.request.requestParams = newRequestParams

  console.log('[triggerComponentRequest] After Params:', JSON.stringify(config.request.requestParams.Params))
  console.log('[triggerComponentRequest] === END ===')

  return true
}

/**
 * 获取组件的请求数据
 */
export function getComponentData(componentId: string): any {
  const config = componentConfigs[componentId]
  if (!config) return undefined
  return config.option
}

/**
 * 设置组件的请求数据（option）
 */
export function setComponentData(componentId: string, data: any): boolean {
  const config = componentConfigs[componentId]
  if (!config) {
    console.warn(`[setComponentData] Component not found: ${componentId}`)
    return false
  }
  config.option = data
  return true
}

/**
 * 获取组件的 ECharts 实例
 */
export function getComponentChart(componentId: string): any {
  const vueInstance = components[componentId]
  if (!vueInstance) return undefined
  return vueInstance.chart
}

/**
 * 获取全局参数列表（包含 URL 参数和自定义参数）
 */
export function getAllGlobalParams(): Record<string, string> {
  return getGlobalParams()
}

// 组件事件处理 hook
export const useLifeHandler = (chartConfig: CreateComponentType | CreateComponentGroupType) => {
  if (!chartConfig.events) return {}

  // 注册当前组件配置 - 确保注册的是 store 中的响应式对象
  if (!chartConfig.isGroup) {
    // 先尝试从 store 获取，确保 componentConfigs 存的是响应式引用
    const storeConfig = findComponentInStore(chartConfig.id)
    if (storeConfig) {
      // store 中的对象，componentConfigs 直接复用同一个引用
      componentConfigs[chartConfig.id] = storeConfig
      console.log('[useLifeHandler] Registered from store:', chartConfig.id)
    } else {
      // 组件还未加入 store（预览时可能如此），使用传入的 chartConfig
      registerComponentConfig(chartConfig.id, chartConfig as CreateComponentType)
      console.log('[useLifeHandler] Registered from chartConfig:', chartConfig.id)
    }
  }

  // 处理基础事件
  const baseEvent: { [key: string]: any } = {}
  for (const key in chartConfig.events.baseEvent) {
    const fnStr: string | undefined = (chartConfig.events.baseEvent as any)[key]
    // 动态绑定基础事件
    if (fnStr) {
      baseEvent[key] = generateBaseFunc(fnStr)
    }
  }

  // 生成生命周期事件
  const events = chartConfig.events.advancedEvents || {}
  const lifeEvents = {
    [EventLife.VNODE_BEFORE_MOUNT](e: any) {
      // 存储组件
      components[chartConfig.id] = e.component
      const fnStr = (events[EventLife.VNODE_BEFORE_MOUNT] || '').trim()
      generateFunc(fnStr, e)
    },
    [EventLife.VNODE_MOUNTED](e: any) {
      const fnStr = (events[EventLife.VNODE_MOUNTED] || '').trim()
      generateFunc(fnStr, e)
    }
  }
  return { ...baseEvent, ...lifeEvents }
}

// 基础事件和高级事件共享的辅助函数集合
const helperFunctionsObj = {
  triggerComponentRequest,
  getComponentData,
  setComponentData,
  getComponentChart,
  getAllComponentConfigs,
  getComponentConfig,
  registerComponentConfig,
  setGlobalParam,
  setGlobalParams,
  getGlobalParams,
  clearGlobalParams,
  getUrlParam,
  getPlaceholderParams,
  hasUrlParams
}

/**
 * 生成基础函数
 * @param fnStr 用户方法体代码
 * @param event 鼠标事件
 */
export function generateBaseFunc(fnStr: string) {
  try {
    // 将辅助函数名作为参数注入，使脚本中可以直接调用
    const helperNames = Object.keys(helperFunctionsObj).join(', ')
    return new Function(`
      return (
        async function(components, mouseEvent, { ${helperNames} }){
          ${fnStr}
        }
      )`)().bind(undefined, components, undefined, helperFunctionsObj)
  } catch (error) {
    console.error(error)
  }
}

/**
 * 生成高级函数（包含辅助函数）
 */
function generateFunc(fnStr: string, e: any) {
  try {
    // npmPkgs 便于拷贝 echarts 示例时设置option 的formatter等相关内容
    // 定义辅助函数 - 将导入的函数作为参数传递，解构所有辅助函数
    const helperNames = Object.keys(helperFunctionsObj)
    const helperFunctions = helperNames.map(name => `const ${name} = _p.${name};`).join('\n      ')

    // 创建包含辅助函数的对象
    const helperParams = {
      ...helperFunctionsObj
    }

    Function(`
      "use strict";
      return (
        async function(e, components, node_modules, _p){
          const {${Object.keys(npmPkgs).join()}} = node_modules;
          ${helperFunctions}
          ${fnStr}
        }
      )`)().bind(e?.component)(e, components, npmPkgs, helperParams)
  } catch (error) {
    console.error(error)
  }
}
