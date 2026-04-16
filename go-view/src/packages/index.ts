import { ChartList } from '@/packages/components/Charts/index'
import { VChartList } from '@/packages/components/VChart/index'
import { DecorateList } from '@/packages/components/Decorates/index'
import { InformationList } from '@/packages/components/Informations/index'
import { TableList } from '@/packages/components/Tables/index'
import { PhotoList } from '@/packages/components/Photos/index'
import { IconList } from '@/packages/components/Icons/index'
import { PackagesCategoryEnum, PackagesType, ConfigType, FetchComFlagType, CreateComponentType } from '@/packages/index.d'
import { PublicConfigClass } from '@/packages/public'
import cloneDeep from 'lodash/cloneDeep'

const configModules: Record<string, { default: string }> = import.meta.glob('./components/**/config.vue', {
  eager: true
})
const indexModules: Record<string, { default: string }> = import.meta.glob('./components/**/index.vue', {
  eager: true
})
const imagesModules: Record<string, { default: string }> = import.meta.glob('../assets/images/chart/**', {
  eager: true
})

// * 所有图表
export let packagesList: PackagesType = {
  [PackagesCategoryEnum.CHARTS]: ChartList,
  [PackagesCategoryEnum.VCHART]: VChartList,
  [PackagesCategoryEnum.INFORMATIONS]: InformationList,
  [PackagesCategoryEnum.TABLES]: TableList,
  [PackagesCategoryEnum.DECORATES]: DecorateList,
  [PackagesCategoryEnum.PHOTOS]: PhotoList,
  [PackagesCategoryEnum.ICONS]: IconList
}

// 组件缓存, 可以大幅度提升组件加载速度
const componentCacheMap = new Map<string, Promise<any>>()

/**
 * 默认占位组件配置（当真实组件不存在时使用）
 */
const createPlaceholderComponent = (packageName: string, categoryName: string, keyName: string) => {
  console.warn(`[组件加载警告] 组件不存在: ${packageName}/${categoryName}/${keyName}，使用默认占位组件`)
  
  // 创建一个默认的占位组件
  const placeholderKey = `Placeholder_${packageName}_${categoryName}_${keyName}`
  
  class PlaceholderConfig extends PublicConfigClass implements CreateComponentType {
    public key = placeholderKey
    public chartConfig = {
      key: placeholderKey,
      chartKey: `Chart_${placeholderKey}`,
      conKey: `Config_${placeholderKey}`,
      title: `缺失组件: ${keyName}`,
      category: categoryName,
      categoryName: categoryName,
      package: packageName as PackagesCategoryEnum,
      chartFrame: undefined,
      image: '',
      redirectComponent: undefined,
      dataset: undefined,
      disabled: false,
      icon: undefined,
      configEvents: undefined
    }
    public option = {
      placeholder: true,
      message: `组件 ${keyName} 不存在，请检查组件文件或项目配置`,
      dataset: []
    }
  }
  
  return Promise.resolve({ default: PlaceholderConfig })
}

const loadConfig = async (packageName: string, categoryName: string, keyName: string) => {
  const key = packageName + categoryName + keyName
  
  if (!componentCacheMap.has(key)) {
    // 动态导入组件，添加异常处理
    const loadPromise = import(`./components/${packageName}/${categoryName}/${keyName}/config.ts`)
      .then(module => {
        console.log(`[组件加载成功] ${packageName}/${categoryName}/${keyName}`)
        return module
      })
      .catch(async (error) => {
        console.error(`[组件加载失败] ${packageName}/${categoryName}/${keyName}:`, error.message)
        // 组件不存在时返回默认占位组件
        return createPlaceholderComponent(packageName, categoryName, keyName)
      })
    
    componentCacheMap.set(key, loadPromise)
  }
  
  return componentCacheMap.get(key)
}

/**
 * * 获取目标组件配置信息
 * @param targetData
 */
export const createComponent = async (targetData: ConfigType) => {
  const { redirectComponent, category, key } = targetData
  // redirectComponent 是给图片组件库和图标组件库使用的
  if (redirectComponent) {
    const [packageName, categoryName, keyName] = redirectComponent.split('/')
    const redirectChart = await loadConfig(packageName, categoryName, keyName)
    return new redirectChart.default()
  }
  const chart = await loadConfig(targetData.package, category, key)
  return new chart.default()
}

/**
 * * 获取组件
 * @param {string} chartName 名称
 * @param {FetchComFlagType} flag 标识 0为展示组件, 1为配置组件
 */
const fetchComponent = (chartName: string, flag: FetchComFlagType) => {
  const module = flag === FetchComFlagType.VIEW ? indexModules : configModules
  for (const key in module) {
    const urlSplit = key.split('/')
    if (urlSplit[urlSplit.length - 2] === chartName) {
      return module[key]
    }
  }
  return undefined
}

/**
 * * 获取展示组件
 * @param {ConfigType} dropData 配置项
 */
export const fetchChartComponent = (dropData: ConfigType) => {
  const { key } = dropData
  const component = fetchComponent(key, FetchComFlagType.VIEW)
  
  if (!component) {
    console.warn(`[组件加载警告] 未找到展示组件: ${key}，使用占位组件`)
    // 返回占位组件
    return () => import('./components/Placeholder/index.vue')
  }
  
  return component?.default
}

/**
 * * 获取配置组件
 * @param {ConfigType} dropData 配置项
 */
export const fetchConfigComponent = (dropData: ConfigType) => {
  const { key } = dropData
  const component = fetchComponent(key, FetchComFlagType.CONFIG)
  
  if (!component) {
    console.warn(`[组件加载警告] 未找到配置组件: ${key}`)
    // 返回空配置
    return undefined
  }
  
  return component?.default
}

/**
 * * 获取图片内容
 * @param {ConfigType} targetData 配置项
 */
export const fetchImages = async (targetData?: ConfigType) => {
  if (!targetData) return ''
  // 正则判断图片是否为 url，是则直接返回该 url
  if (/^(http|https):\/\/([\w.]+\/?)\S*/.test(targetData.image)) return targetData.image
  // 新数据动态处理
  const { image } = targetData
  // 兼容旧数据
  if (image.includes('@') || image.includes('base64')) return image

  const imageName = image.substring(image.lastIndexOf('/') + 1)
  for (const key in imagesModules) {
    const urlSplit = key.split('/')
    if (urlSplit[urlSplit.length - 1] === imageName) {
      return imagesModules[key]?.default
    }
  }
  return ''
}
