import { CreateComponentType, CreateComponentGroupType } from '@/packages/index.d'
import { EventLife } from '@/enums/eventEnum'
import * as echarts from 'echarts'
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
 * 触发组件重新请求（通过修改 requestParams）
 * @param componentId 组件ID
 * @param params 要修改的参数 { key: value }
 */
export function triggerComponentRequest(componentId: string, params?: Record<string, any>) {
  const config = componentConfigs[componentId]
  if (!config) {
    console.warn(`[triggerComponentRequest] Component not found: ${componentId}`)
    return false
  }

  // 如果提供了参数，先修改
  if (params) {
    Object.keys(params).forEach(key => {
      config.request.requestParams.Params[key] = params[key]
    })
  } else {
    // 触发 watch：给一个临时值再恢复，强制触发 watch
    config.request.requestParams.Params['_trigger'] = Date.now()
  }

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

  // 注册当前组件配置
  if (!chartConfig.isGroup) {
    registerComponentConfig(chartConfig.id, chartConfig as CreateComponentType)
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

/**
 * 生成基础函数
 * @param fnStr 用户方法体代码
 * @param event 鼠标事件
 */
export function generateBaseFunc(fnStr: string) {
  try {
    return new Function(`
      return (
        async function(components, mouseEvent){
          ${fnStr}
        }
      )`)().bind(undefined, components)
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
    // 定义辅助函数 - 使用与导入函数不同的名称避免覆盖
    const helperFunctions = `
      // 全局参数相关辅助函数（使用别名避免与导入函数冲突）
      const _setGlobalParam = setGlobalParam;
      const _setGlobalParams = setGlobalParams;
      const _getGlobalParams = getGlobalParams;
      const _clearGlobalParams = clearGlobalParams;
      const _getUrlParam = getUrlParam;
      const _getPlaceholderParams = getPlaceholderParams;
      const _hasUrlParams = hasUrlParams;
    `

    Function(`
      "use strict";
      return (
        async function(e, components, node_modules){
          const {${Object.keys(npmPkgs).join()}} = node_modules;
          ${helperFunctions}
          ${fnStr}
        }
      )`)().bind(e?.component)(e, components, npmPkgs)
  } catch (error) {
    console.error(error)
  }
}
