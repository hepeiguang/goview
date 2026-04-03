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
                      <n-text depth="3" style="font-weight: 500">triggerComponentRequest(id, params)</n-text>
                      <n-text depth="3" style="margin-left: 8px">触发指定组件重新请求</n-text>
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

// 示例代码 - 使用普通字符串避免模板解析问题
const exampleCode1 = `// 获取指定组件实例
const instance = components['组件ID'];

// 访问组件配置
const config = instance.value;

// 获取 option 数据
const option = config.option;

// 获取 ECharts 实例
const chart = instance.chart;`

const exampleCode2 = `// 点击柱状图某柱子，获取数据并触发饼图刷新
async click(mouseEvent, components) {
  // 获取当前 ECharts 实例
  const myChart = this.chart;
  const option = myChart?.getOption();

  // 获取点击的系列数据
  const seriesData = option?.series?.[0]?.data;
  const clickedValue = seriesData?.[0];

  // 触发饼图组件重新请求
  if (clickedValue) {
    triggerComponentRequest('饼图组件ID', {
      category: clickedValue.name,
      value: clickedValue.value
    });
  }
}`

const exampleCode3 = `// 直接修改目标组件的 requestParams 触发刷新
async click(mouseEvent, components) {
  // 通过组件ID获取目标组件
  const targetComp = components['目标组件ID'];

  // 修改 Params 参数（自动触发 watch 重新请求）
  targetComp.value.request.requestParams.Params.id = 'newId';
  targetComp.value.request.requestParams.Params.type = 'category';

  // 或者修改 Header
  targetComp.value.request.requestParams.Header.token = 'Bearer xxx';
}`

const exampleCode4 = `// 获取其他组件数据，处理后更新当前组件
async click(mouseEvent, components) {
  // 获取其他组件的数据
  const otherData = getComponentData('其他组件ID');
  const otherOption = otherData?.option;

  // 获取 ECharts 实例
  const chart = getComponentChart('目标组件ID');

  // 修改图表配置并更新
  const newOption = {
    ...chart.getOption(),
    series: [{ data: otherOption?.dataset?.source }]
  };
  chart.setOption(newOption);
}`

const exampleCode5 = `// URL参数占位符使用 (使用 __param__ 代替双花括号)
// URL: ?region=beijing&type=1
// 组件配置中设置 Params: { region: "__param__region__" }
// 然后通过修改触发请求

async click(mouseEvent, components) {
  const targetComp = components['目标组件ID'];

  // 修改占位符对应的参数值
  targetComp.value.request.requestParams.Params.region = 'shanghai';
  targetComp.value.request.requestParams.Params.type = '2';
  // 参数会自动替换 URL 中的占位符
}`

const exampleCode6 = `// 遍历所有组件并触发批量更新
async click(mouseEvent, components) {
  // 遍历所有组件
  for (const id in components) {
    const comp = components[id];
    const config = comp?.value;

    // 根据组件类型或配置做不同处理
    if (config?.chartConfig?.chartFrame === 'echarts') {
      // 刷新所有 ECharts 组件
      comp.chart?.resize();
    }

    // 或者批量设置参数
    if (config?.request?.requestUrl?.includes('/api/data')) {
      config.request.requestParams.Params.refresh = Date.now();
    }
  }
}`

// 受控弹窗
const showModal = ref(false)
// 编辑区域控制
const editTab = ref(BaseEvent.ON_CLICK)
// events 函数模板
let baseEvent = ref({ ...targetData.value.events.baseEvent })
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
