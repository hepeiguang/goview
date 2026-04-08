<template>
  <n-collapse-item title="基础事件配置" name="2">
    <template #header-extra>
      <n-button type="primary" tertiary size="small" @click.stop="showModal = true">
        <template #icon>
          <n-icon>
            <pencil-icon />
          </n-icon>
        </template>
        编辑
      </n-button>
    </template>
    <n-card class="collapse-show-box">
      <!-- 函数体 -->
      <div v-for="eventName in BaseEvent" :key="eventName">
        <p>
          <span class="func-annotate">// {{ EventTypeName[eventName] }}</span>
          <br />
          <span class="func-keyword">async {{ eventName }}</span> (mouseEvent,components) {
        </p>
        <p class="go-ml-4">
          <n-code :code="(targetData.events.baseEvent || {})[eventName] || ''" language="typescript"></n-code>
        </p>
        <p>}<span>,</span></p>
      </div>
    </n-card>
  </n-collapse-item>

  <!-- 弹窗 -->
  <n-modal class="go-chart-data-monaco-editor" v-model:show="showModal" :mask-closable="false">
    <n-card :bordered="false" role="dialog" size="small" aria-modal="true" style="width: 1200px; height: 700px">
      <template #header>
        <n-space>
          <n-text>基础事件编辑器</n-text>
        </n-space>
      </template>

      <template #header-extra> </template>
      <n-layout has-sider sider-placement="right">
        <n-layout style="height: 580px; padding-right: 20px">
          <n-tabs v-model:value="editTab" type="card" tab-style="min-width: 100px;">
            <!-- 提示 -->
            <template #suffix>
              <n-text class="tab-tip" type="warning">提示: ECharts 组件会拦截鼠标事件</n-text>
            </template>
            <n-tab-pane
              v-for="(eventName, index) in BaseEvent"
              :key="index"
              :tab="EventTypeName[eventName] + '-' + eventName"
              :name="eventName"
            >
              <!-- 函数名称 -->
              <p class="go-pl-3">
                <span class="func-keyword">async function &nbsp;&nbsp;</span>
                <span class="func-keyNameWord">{{ eventName }}(mouseEvent,components)&nbsp;&nbsp;{</span>
              </p>
              <!-- 编辑主体 -->
              <monaco-editor v-model:modelValue="baseEvent[eventName]" height="480px" language="javascript" />
              <!-- 函数结束 -->
              <p class="go-pl-3 func-keyNameWord">}</p>
            </n-tab-pane>
          </n-tabs>
        </n-layout>
        <n-layout-sider
          :collapsed-width="14"
          :width="340"
          show-trigger="bar"
          collapse-mode="transform"
          content-style="padding: 12px 12px 0px 12px;margin-left: 3px;"
        >
          <n-tabs default-value="1" justify-content="space-evenly" type="segment">
            <!-- 验证结果 -->
            <n-tab-pane tab="验证结果" name="1" size="small">
              <n-scrollbar trigger="none" style="max-height: 505px">
                <n-collapse class="go-px-3" arrow-placement="right" :default-expanded-names="[1, 2, 3]">
                  <template v-for="error in [validEvents()]" :key="error">
                    <n-collapse-item title="错误函数" :name="1">
                      <n-text depth="3">{{ error.errorFn || '暂无' }}</n-text>
                    </n-collapse-item>
                    <n-collapse-item title="错误信息" :name="2">
                      <n-text depth="3">{{ error.name || '暂无' }}</n-text>
                    </n-collapse-item>
                    <n-collapse-item title="堆栈信息" :name="3">
                      <n-text depth="3">{{ error.message || '暂无' }}</n-text>
                    </n-collapse-item>
                  </template>
                </n-collapse>
              </n-scrollbar>
            </n-tab-pane>
            <!-- 辅助说明 -->
            <n-tab-pane tab="变量说明" name="2">
              <n-scrollbar trigger="none" style="max-height: 505px">
                <n-collapse class="go-px-3" arrow-placement="right" :default-expanded-names="[1, 2, 3, 4, 5]">
                  <!-- mouseEvent -->
                  <n-collapse-item title="mouseEvent (鼠标事件)" :name="1">
                    <n-space vertical :size="[4, 0]">
                      <n-text depth="3">原生鼠标事件对象，包含以下属性：</n-text>
                      <n-text depth="3">- clientX/clientY: 鼠标坐标</n-text>
                      <n-text depth="3">- offsetX/offsetY: 相对于元素坐标</n-text>
                      <n-text depth="3">- target: 事件目标元素</n-text>
                      <n-text depth="3">- type: 事件类型</n-text>
                    </n-space>
                  </n-collapse-item>

                  <!-- components -->
                  <n-collapse-item title="components (组件映射)" :name="2">
                    <n-space vertical :size="[4, 0]">
                      <n-text depth="3">所有图表组件的 Vue 实例映射表</n-text>
                      <n-text depth="3">格式: { componentId: VueInstance }</n-text>
                      <n-text depth="3" style="margin-top: 4px">示例：</n-text>
                      <n-code :code="exampleCode1" language="javascript" />
                    </n-space>
                  </n-collapse-item>

                  <!-- this -->
                  <n-collapse-item title="this (当前组件)" :name="3">
                    <n-space vertical :size="[4, 0]">
                      <n-text depth="3">当前绑定事件的组件实例</n-text>
                      <n-text depth="3">- this.chart: ECharts 实例</n-text>
                      <n-text depth="3">- this.value: 组件配置对象</n-text>
                      <n-text depth="3">- this.value.option: 图表配置数据</n-text>
                      <n-text depth="3">- this.value.request: 请求配置</n-text>
                    </n-space>
                  </n-collapse-item>

                  <!-- 辅助函数 -->
                  <n-collapse-item title="辅助函数" :name="4">
                    <n-space vertical :size="[4, 0]">
                      <n-text depth="3" style="font-weight: 500">triggerComponentRequest(id, params, body, header)</n-text>
                      <n-text depth="3" style="margin-left: 8px">触发组件重新请求</n-text>
                      <n-text depth="3" style="margin-left: 8px">- params: URL查询参数</n-text>
                      <n-text depth="3" style="margin-left: 8px">- body: 请求体参数(form-data/json)</n-text>
                      <n-text depth="3" style="margin-left: 8px">- header: 请求头参数</n-text>
                      <n-text depth="3" style="font-weight: 500; margin-top: 8px">getComponentData(id)</n-text>
                      <n-text depth="3" style="margin-left: 8px">获取组件配置数据 (option)</n-text>
                      <n-text depth="3" style="font-weight: 500; margin-top: 8px">setComponentData(id, data)</n-text>
                      <n-text depth="3" style="margin-left: 8px">设置组件数据并更新视图</n-text>
                      <n-text depth="3" style="font-weight: 500; margin-top: 8px">getComponentChart(id)</n-text>
                      <n-text depth="3" style="margin-left: 8px">获取 ECharts 实例</n-text>
                      <n-text depth="3" style="font-weight: 500; margin-top: 8px">getAllComponentConfigs()</n-text>
                      <n-text depth="3" style="margin-left: 8px">获取所有组件配置映射</n-text>
                    </n-space>
                  </n-collapse-item>

                  <!-- 示例代码 -->
                  <n-collapse-item title="图表联动示例" :name="5">
                    <n-space vertical :size="[8, 0]">
                      <!-- 示例1 -->
                      <n-tag :bordered="false" type="success" size="small">示例1: 点击柱状图刷新饼图</n-tag>
                      <n-code :code="exampleCode2" language="javascript" />

                      <!-- 示例2 -->
                      <n-tag :bordered="false" type="success" size="small" style="margin-top: 8px">示例2: 直接修改请求参数</n-tag>
                      <n-code :code="exampleCode3" language="javascript" />

                      <!-- 示例3 -->
                      <n-tag :bordered="false" type="success" size="small" style="margin-top: 8px">示例3: 获取数据过滤后更新</n-tag>
                      <n-code :code="exampleCode4" language="javascript" />

                      <!-- 示例4 -->
                      <n-tag :bordered="false" type="success" size="small" style="margin-top: 8px">示例4: URL参数占位符使用</n-tag>
                      <n-code :code="exampleCode5" language="javascript" />

                      <!-- 示例5 -->
                      <n-tag :bordered="false" type="success" size="small" style="margin-top: 8px">示例5: 遍历所有组件</n-tag>
                      <n-code :code="exampleCode6" language="javascript" />
                    </n-space>
                  </n-collapse-item>
                </n-collapse>
              </n-scrollbar>
            </n-tab-pane>
          </n-tabs>
        </n-layout-sider>
      </n-layout>

      <template #action>
        <n-space justify="space-between">
          <div class="go-flex-items-center">
            <n-tag :bordered="false" type="primary">
              <template #icon>
                <n-icon :component="DocumentTextIcon" />
              </template>
              说明
            </n-tag>
            <n-text class="go-ml-2" depth="2">编写方式同正常 JavaScript 写法</n-text>
          </div>

          <n-space>
            <n-button size="medium" @click="closeEvents">取消</n-button>
            <n-button size="medium" type="primary" @click="saveEvents">保存</n-button>
          </n-space>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRefs, toRaw } from 'vue'
import { MonacoEditor } from '@/components/Pages/MonacoEditor'
import { useTargetData } from '../../../hooks/useTargetData.hook'
import { BaseEvent } from '@/enums/eventEnum'
import { icon } from '@/plugins'

const { targetData, chartEditStore } = useTargetData()
const { DocumentTextIcon, ChevronDownIcon, PencilIcon } = icon.ionicons5

const EventTypeName: Record<string, string> = {
  [BaseEvent.ON_CLICK]: '单击',
  [BaseEvent.ON_DBL_CLICK]: '双击',
  [BaseEvent.ON_MOUSE_ENTER]: '鼠标进入',
  [BaseEvent.ON_MOUSE_LEAVE]: '鼠标移出'
}

const exampleCode1 = `// 示例: 获取指定组件实例
// components: { componentId: VueInstance }
const instance = components['组件ID'];
const config = instance.value; // 组件配置
const option = config.option; // 图表数据
const chart = instance.chart; // ECharts 实例`

const exampleCode2 = `// 示例: 点击柱状图触发饼图刷新
// 触发组件重新请求（params/body/header 都可选）
// triggerComponentRequest(id, params, body, header)
triggerComponentRequest('饼图组件ID', {
  category: 'value1',
  page: 1
}, {
  database: 'mydb'
}, {
  Authorization: 'Bearer xxx'
});`

const exampleCode3 = `// 示例: 仅修改 Params 参数
triggerComponentRequest('目标组件ID', {
  id: '123',
  type: 'category'
});

// 示例: 仅修改 Body 参数
triggerComponentRequest('目标组件ID', null, {
  sql: 'SELECT * FROM users',
  timeout: 30
});

// 示例: 同时修改 Params 和 Header
triggerComponentRequest('目标组件ID', {
  region: 'beijing'
}, null, {
  token: 'Bearer xxx'
});`

const exampleCode4 = `// 示例: 获取数据处理后更新视图
// 获取其他组件的数据
const otherData = getComponentData('其他组件ID');

// 获取 ECharts 实例
const chart = getComponentChart('目标组件ID');

// 修改图表配置并更新
const newOption = {
  ...chart.getOption(),
  series: [{ data: otherData?.dataset?.source }]
};
chart.setOption(newOption);`

const exampleCode5 = `// 示例: URL参数占位符使用
// URL: /api/data?region=__region__&type=__type__
// 配置 Params: { region: 'beijing', type: '1' }
// 点击时动态修改参数触发刷新
triggerComponentRequest('目标组件ID', {
  region: 'shanghai',
  type: '2'
});`

const exampleCode6 = `// 示例: 遍历所有组件触发批量更新
for (const id in components) {
  const comp = components[id];
  const config = comp?.value;

  // 刷新所有 ECharts 组件
  if (config?.chartConfig?.chartFrame === 'echarts') {
    comp.chart?.resize();
  }

  // 或批量设置请求参数
  if (config?.request?.requestUrl?.includes('/api')) {
    triggerComponentRequest(id, { refresh: Date.now() });
  }
}`

// 默认示例代码
const defaultEventCode = `// triggerComponentRequest(id, params, body, header)
// 触发组件重新请求
// 参数说明:
//   - params: URL查询参数 { key: value }
//   - body: 请求体参数 { key: value }
//   - header: 请求头参数 { key: value }

// 示例: 触发其他组件重新请求
triggerComponentRequest('组件ID', {
  category: 'value1'
});

// 示例: 获取组件数据
const data = getComponentData('组件ID');

// 示例: 获取 ECharts 实例
const chart = getComponentChart('组件ID');

// 示例: 设置组件数据
setComponentData('组件ID', newData);
`

// 受控弹窗
const showModal = ref(false)
// 编辑区域控制
const editTab = ref(BaseEvent.ON_CLICK)
// events 函数模板
const baseEvent = ref<Record<string, string>>({})

// 初始化时设置默认示例代码
const initBaseEvent = () => {
  const existing = targetData.value.events.baseEvent || {}
  baseEvent.value = {}
  // 获取 BaseEvent 枚举的所有事件名称
  const eventNames = Object.keys(BaseEvent).filter(k => !isNaN(Number(k)))
  for (const key of eventNames) {
    const eventName = BaseEvent[key as keyof typeof BaseEvent]
    // 如果已有代码则使用，否则使用默认示例
    baseEvent.value[eventName] = existing[eventName] || defaultEventCode
  }
}

// 初始化
initBaseEvent()
// 事件错误标识
const errorFlag = ref(false)

// 验证语法
const validEvents = () => {
  let errorFn = ''
  let message = ''
  let name = ''

  errorFlag.value = Object.entries(baseEvent.value).every(([eventName, str]) => {
    try {
      // 支持await，验证语法
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
      new AsyncFunction(str)
      return true
    } catch (error: any) {
      message = error.message
      name = error.name
      errorFn = eventName
      return false
    }
  })
  return {
    errorFn,
    message,
    name
  }
}

// 关闭事件
const closeEvents = () => {
  showModal.value = false
}

// 新增事件
const saveEvents = () => {
  if (validEvents().errorFn) {
    window['$message'].error('事件函数错误，无法进行保存')
    return
  }
  if (Object.values(baseEvent.value).join('').trim() === '') {
    // 清空事件
    targetData.value.events.baseEvent = {
      [BaseEvent.ON_CLICK]: undefined,
      [BaseEvent.ON_DBL_CLICK]: undefined,
      [BaseEvent.ON_MOUSE_ENTER]: undefined,
      [BaseEvent.ON_MOUSE_LEAVE]: undefined
    }
  } else {
    targetData.value.events.baseEvent = { ...baseEvent.value }
  }
  closeEvents()
}

watch(
  () => showModal.value,
  (newData: boolean) => {
    if (newData) {
      baseEvent.value = { ...targetData.value.events.baseEvent }
    }
  }
)
</script>

<style lang="scss" scoped>
@import '../index.scss';
</style>
