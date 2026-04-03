<template>
  <!-- 全局配置 -->
  <n-card class="n-card-shallow">
    <n-tag type="info" :bordered="false" style="border-radius: 5px"> 全局公共配置 </n-tag>
    <setting-item-box
      name="服务"
      :itemRightStyle="{
        gridTemplateColumns: '5fr 2fr 1fr'
      }"
    >
      <!-- 源地址 -->
      <setting-item name="前置 URL">
        <n-input
          v-model:value.trim="requestOriginUrl"
          :disabled="editDisabled"
          placeholder="例：http://127.0.0.1/"
        ></n-input>
      </setting-item>
      <setting-item name="更新间隔，为 0 只会初始化">
        <n-input-group>
          <n-input-number
            class="select-time-number"
            v-model:value.trim="requestInterval"
            min="0"
            :show-button="false"
            :disabled="editDisabled"
            placeholder="请输入数字"
          >
          </n-input-number>
          <!-- 单位 -->
          <n-select
            class="select-time-options"
            v-model:value="requestIntervalUnit"
            :options="selectTimeOptions"
            :disabled="editDisabled"
          />
        </n-input-group>
      </setting-item>
      <n-button v-show="editDisabled" type="primary" ghost @click="editDisabled = false">
        <template #icon>
          <n-icon>
            <pencil-icon />
          </n-icon>
        </template>
        编辑配置
      </n-button>
    </setting-item-box>
    <!-- table 内容体 -->
    <n-collapse-transition :show="showTable">
      <request-global-header-table :editDisabled="editDisabled"></request-global-header-table>

      <!-- 全局参数配置 -->
      <div class="global-params-box">
        <n-divider>
          全局参数配置
          <template #extra>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-icon size="16" style="cursor: help; margin-left: 4px;">
                  <help-icon />
                </n-icon>
              </template>
              <n-space vertical size="small" style="max-width: 400px;">
                <n-text strong>全局参数使用说明</n-text>
                <n-text depth="3" style="font-size: 12px;">
                  1. 全局参数用于在组件请求中进行动态值替换
                </n-text>
                <n-text depth="3" style="font-size: 12px;">
                  2. 在请求配置中使用 {"{"}{"{"} 参数名 {"}"}{"}" 占位符
                </n-text>
                <n-text depth="3" style="font-size: 12px;">
                  3. 占位符会自动替换为下方配置的实际值
                </n-text>
                <n-text depth="3" style="font-size: 12px;">
                  4. 支持 URL 参数（如 ?token=xxx）自动同步
                </n-text>
                <n-text depth="3" style="font-size: 12px;">
                  5. 组件本地参数优先级高于全局参数
                </n-text>
                <n-divider style="margin: 8px 0;" />
                <n-text depth="3" style="font-size: 12px;">
                  示例：配置 region=beijing，在 Params 中设置 region={"{"}{"{"}region{"}"}{"}"
                </n-text>
              </n-space>
            </n-tooltip>
          </template>
        </n-divider>

        <!-- URL 参数说明 -->
        <n-alert type="info" :show-icon="false" style="margin-bottom: 12px;">
          <template #header>
            <n-space align="center">
              <n-icon><information-circle-icon /></n-icon>
              <n-text>URL 参数同步</n-text>
            </n-space>
          </template>
          <n-text depth="3" style="font-size: 12px;">
            URL 中的参数（如 ?token=xxx&amp;region=beijing）会自动同步到全局参数列表，无需手动配置。
            可通过点击下方 &lt;刷新 URL 参数&gt; 按钮手动同步。
          </n-text>
          <n-button size="tiny" quaternary style="margin-left: 8px;" @click="syncUrlParams">
            刷新 URL 参数
          </n-button>
        </n-alert>

        <!-- 参数列表 -->
        <n-space vertical>
          <n-text depth="2" style="font-size: 13px; font-weight: 500;">
            已配置参数 ({{ globalParamsList.length }})
          </n-text>
          <n-space v-for="(param, index) in globalParamsList" :key="index" align="center">
            <n-tag :bordered="false" size="small" type="info">{{ param.key || '(未命名)' }}</n-tag>
            <n-input
              v-model:value="param.key"
              placeholder="参数名"
              :disabled="editDisabled"
              style="width: 120px"
              @update:value="updateGlobalParams"
            />
            <n-input
              v-model:value="param.value"
              placeholder="参数值"
              :disabled="editDisabled"
              style="width: 180px"
              @update:value="updateGlobalParams"
            />
            <n-tag v-if="param.isFromUrl" size="small" :bordered="false" type="success">URL</n-tag>
            <n-button
              v-if="!editDisabled"
              quaternary
              circle
              size="small"
              type="error"
              @click="removeParam(index)"
            >
              <template #icon>
                <n-icon><close-icon /></n-icon>
              </template>
            </n-button>
          </n-space>
          <n-button v-if="!editDisabled" size="small" @click="addParam">
            <template #icon>
              <n-icon><add-icon /></n-icon>
            </template>
            添加参数
          </n-button>
        </n-space>

        <!-- 参数使用示例 -->
        <n-collapse style="margin-top: 16px;">
          <n-collapse-item title="使用示例" name="example">
            <n-code :code="exampleCode" language="javascript" />
          </n-collapse-item>
        </n-collapse>

        <!-- 已保存的全局参数（预览） -->
        <n-divider style="margin-top: 16px;">已保存的全局参数</n-divider>
        <n-text depth="3" style="font-size: 12px; display: block; margin-bottom: 8px;">
          以下参数会随项目一起保存，跨页面共享使用
        </n-text>
        <div class="params-preview">
          <n-tag
            v-for="(value, key) in savedGlobalParams"
            :key="key"
            :bordered="false"
            size="small"
            style="margin: 4px;"
          >
            {{ key }}: {{ value }}
          </n-tag>
          <n-text v-if="!hasSavedParams" depth="3" style="font-size: 12px;">
            暂无已保存的参数
          </n-text>
        </div>
      </div>
    </n-collapse-transition>
    <!-- 箭头 -->
    <div v-if="showTable" class="go-flex-center go-mt-3 down" @click="showTable = false">
      <n-icon size="32">
        <chevron-up-outline-icon />
      </n-icon>
    </div>
    <div v-else class="go-flex-center go-mt-3 down" @click="showTable = true">
      <n-tooltip trigger="hover" placement="top" :keep-alive-on-hover="false">
        <template #trigger>
          <n-icon size="32">
            <chevron-down-outline-icon />
          </n-icon>
        </template>
        展开
      </n-tooltip>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { ref, toRefs, computed, watch } from 'vue'
import { useDesignStore } from '@/store/modules/designStore/designStore'
import { SettingItemBox, SettingItem } from '@/components/Pages/ChartItemSetting'
import { useTargetData } from '@/views/chart/ContentConfigurations/components/hooks/useTargetData.hook'
import { selectTypeOptions, selectTimeOptions } from '@/views/chart/ContentConfigurations/components/ChartData/index.d'
import { RequestGlobalHeaderTable } from '../RequestGlobalHeaderTable'
import { icon } from '@/plugins'
import { getUrlParams, setGlobalParams } from '@/utils/urlParams'

const { PencilIcon, ChevronDownOutlineIcon, ChevronUpOutlineIcon, CloseIcon, AddIcon,
        HelpIcon, InformationCircleIcon } = icon.ionicons5
const { chartEditStore } = useTargetData()
const { requestOriginUrl, requestInterval, requestIntervalUnit } = toRefs(chartEditStore.getRequestGlobalConfig)
const editDisabled = ref(true)

const designStore = useDesignStore()

const showTable = ref(false)

// 全局参数列表（包含来源标记）
interface GlobalParamItem {
  key: string
  value: string
  isFromUrl: boolean
}

// 示例代码
const exampleCode = `// 1. 在 Params 中使用占位符
{
  "region": "{{region}}",
  "category": "{{category}}",
  "token": "{{token}}"
}

// 2. 在 Headers 中使用占位符
{
  "Authorization": "Bearer {{token}}"
}

// 3. 在 URL 中使用占位符
/api/data?region={{region}}&type={{type}}

// 4. 设置默认值（参数不存在时使用）
{
  "region": "{{region:beijing}}"
}`

// 全局参数列表
const globalParamsList = ref<GlobalParamItem[]>([])

// 获取已保存的全局参数
const savedGlobalParams = computed(() => {
  return chartEditStore.getRequestGlobalConfig.globalParams || {}
})

// 是否有已保存的参数
const hasSavedParams = computed(() => {
  return Object.keys(savedGlobalParams.value).length > 0
})

// 同步参数到列表
const syncParamsToList = (newParams: Record<string, string> | undefined) => {
  if (newParams && Object.keys(newParams).length > 0) {
    // 从 URL 获取参数
    const urlParams = getUrlParams()

    // 合并：保存的参数 + URL 参数（URL 参数标记为来自 URL）
    const mergedParams: GlobalParamItem[] = []

    // 先添加已保存的参数
    Object.entries(newParams).forEach(([key, value]) => {
      mergedParams.push({
        key,
        value: String(value),
        isFromUrl: false
      })
    })

    // 添加 URL 参数（如果不存在已保存的参数中）
    Object.entries(urlParams).forEach(([key, value]) => {
      const exists = mergedParams.find(p => p.key === key)
      if (!exists) {
        mergedParams.push({
          key,
          value: String(value),
          isFromUrl: true
        })
      }
    })

    globalParamsList.value = mergedParams
  } else {
    // 没有保存的参数，只显示 URL 参数
    const urlParams = getUrlParams()
    globalParamsList.value = Object.entries(urlParams).map(([key, value]) => ({
      key,
      value: String(value),
      isFromUrl: true
    }))
  }
}

// 监听 globalParams 变化，同步到列表
watch(
  () => chartEditStore.getRequestGlobalConfig.globalParams,
  (newParams) => {
    syncParamsToList(newParams)
  },
  { immediate: true, deep: true }
)

// 同步 URL 参数
const syncUrlParams = () => {
  const urlParams = getUrlParams()
  // 合并到现有参数中
  const newList = [...globalParamsList.value]

  Object.entries(urlParams).forEach(([key, value]) => {
    const exists = newList.find(p => p.key === key)
    if (!exists) {
      newList.push({ key, value: String(value), isFromUrl: true })
    }
  })

  globalParamsList.value = newList
  updateGlobalParams()
}

// 更新全局参数到 store
const updateGlobalParams = () => {
  const params: Record<string, string> = {}
  const urlParams = getUrlParams()

  globalParamsList.value.forEach(item => {
    if (item.key.trim()) {
      // 非 URL 参数才保存
      if (!item.isFromUrl || params[item.key.trim()]) {
        params[item.key.trim()] = item.value
      } else if (!params[item.key.trim()]) {
        params[item.key.trim()] = item.value
      }
    }
  })

  chartEditStore.getRequestGlobalConfig.globalParams = params

  // 同步到 urlParams 模块（用于请求时替换）
  setGlobalParams(params)

  console.log('[GlobalParams] Updated:', params)
}

// 添加参数
const addParam = () => {
  globalParamsList.value.push({ key: '', value: '', isFromUrl: false })
}

// 删除参数
const removeParam = (index: number) => {
  const param = globalParamsList.value[index]
  // 如果是 URL 参数，只从列表移除，不影响 URL 参数
  if (param.isFromUrl) {
    globalParamsList.value.splice(index, 1)
  } else {
    globalParamsList.value.splice(index, 1)
    updateGlobalParams()
  }
}

// 颜色
const themeColor = computed(() => {
  return designStore.getAppTheme
})
</script>

<style lang="scss" scoped>
.n-card-shallow {
  &:hover {
    border-color: v-bind('themeColor');
  }
}
.down {
  cursor: pointer;
  &:hover {
    color: v-bind('themeColor');
  }
}
.select-time-number {
  width: 100%;
}
.select-time-options {
  width: 100px;
}
.global-params-box {
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}
.params-preview {
  padding: 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  min-height: 40px;
}
</style>
