<template>
  <n-table class="go-request-header-table-box" :single-line="false" size="small">
    <thead>
      <tr>
        <th></th>
        <th>Key</th>
        <th>Value</th>
        <th>操作</th>
        <th>结果</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in tableArray.content" :key="index">
        <td>
          {{ index + 1 }}
        </td>
        <td>
          <n-input v-model:value="item.key" :disabled="editDisabled" type="text" size="small" @blur="blur" />
        </td>
        <td>
          <!-- Value 输入区域 -->
          <div class="value-cell">
            <!-- 文本模式：直接使用 n-input -->
            <n-input
              v-if="item.valueType === RequestValueTypeEnum.DEFAULT"
              v-model:value="item.value"
              :disabled="editDisabled"
              type="text"
              size="small"
              @blur="blur"
              placeholder="请输入值"
              style="flex: 1"
            />

            <!-- 其他类型：显示预览和编辑按钮 -->
            <template v-else>
              <n-input
                :value="getPreviewText(item.value)"
                readonly
                size="small"
                style="flex: 1"
                @click="openModalEditor(item)"
              >
                <template #prefix>
                  <n-tag :bordered="false" type="info" size="small">
                    {{ RequestValueTypeNameMap[item.valueType] }}
                  </n-tag>
                </template>
              </n-input>
            </template>

            <!-- 高级编辑按钮 -->
            <n-button
              size="small"
              type="primary"
              ghost
              @click="openModalEditor(item)"
            >
              高级
            </n-button>
          </div>
        </td>
        <td>
          <div style="width: 80px">
            <n-button class="go-ml-2" type="primary" size="small" ghost :disabled="editDisabled" @click="add(index)"
              >+</n-button
            >
            <n-button
              class="go-ml-2"
              type="warning"
              size="small"
              ghost
              :disabled="index === 0 && editDisabled"
              @click="remove(index)"
            >
              -
            </n-button>
          </div>
        </td>
        <td>
          <n-button v-if="item.error" class="go-ml-2" text type="error"> 格式错误 </n-button>
          <n-button v-else class="go-ml-2" text type="primary"> 格式通过 </n-button>
        </td>
      </tr>
    </tbody>
  </n-table>

  <!-- 模态框编辑器 -->
  <n-modal
    v-model:show="modalConfig.show"
    preset="card"
    :title="getModalTitle()"
    style="width: 800px; max-width: 90vw"
    :mask-closable="false"
  >
    <div class="modal-editor-container">
      <!-- 类型选择 -->
      <div class="modal-type-selector">
        <n-space align="center">
          <n-text depth="3">内容类型：</n-text>
          <n-select
            v-model:value="modalConfig.valueType"
            :options="valueTypeList"
            style="width: 140px"
          />
        </n-space>
      </div>

      <!-- 语法校验提示 -->
      <n-alert
        v-if="modalConfig.validationMessage && modalConfig.valueType !== RequestValueTypeEnum.DEFAULT"
        :type="modalConfig.validationType"
        class="validation-alert"
      >
        {{ modalConfig.validationMessage }}
      </n-alert>

      <!-- 编辑器区域 -->
      <div class="editor-area">
        <!-- 文本模式：使用 textarea -->
        <n-input
          v-if="modalConfig.valueType === RequestValueTypeEnum.DEFAULT"
          v-model:value="modalConfig.content"
          type="textarea"
          :rows="10"
          placeholder="请输入文本内容"
          @input="validateModalContent"
        />

        <!-- MonacoEditor 模式 -->
        <MonacoEditor
          v-else
          v-model:modelValue="modalConfig.content"
          :language="getMonacoLanguage()"
          width="100%"
          height="400px"
          @blur="validateModalContent"
        />
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <n-space justify="end">
          <n-button @click="closeModalEditor">取消</n-button>
          <n-button type="primary" @click="saveModalEditor">确认</n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { PropType, reactive, ref, watch } from 'vue'
import {
  RequestParamsObjType,
  RequestValueTypeEnum,
  RequestValueTypeNameMap,
  MonacoLanguageMap
} from '@/enums/httpEnum'
import { MonacoEditor } from '@/components/Pages/MonacoEditor'

const emits = defineEmits(['update'])

const props = defineProps({
  target: {
    type: Object as PropType<RequestParamsObjType>,
    required: true,
    default: () => {}
  },
  editDisabled: {
    type: Boolean,
    required: false,
    default: false
  }
})

// 错误标识
const error = ref(false)

// 默认表格
const defaultItem = {
  key: '',
  value: '',
  error: false,
  valueType: RequestValueTypeEnum.DEFAULT // 值类型
}
const tableArray = reactive<{
  content: typeof defaultItem[]
}>({ content: [] })

// ============ 模态框编辑器配置 ============
const modalConfig = reactive({
  show: false, // 模态框显示状态
  content: '', // 编辑内容
  valueType: RequestValueTypeEnum.DEFAULT, // 当前编辑的类型
  currentItem: null as any, // 当前编辑的行项
  validationMessage: '', // 校验提示信息
  validationType: 'success' as 'success' | 'info' | 'warning' | 'error', // 校验提示类型
  previousValue: '' // 保存切换类型前的值
})

// 类型选项列表
const valueTypeList = [
  { label: '文本', value: RequestValueTypeEnum.DEFAULT },
  { label: 'SQL', value: RequestValueTypeEnum.SQL },
  { label: 'JavaScript', value: RequestValueTypeEnum.JAVASCRIPT },
  { label: 'JSON', value: RequestValueTypeEnum.JSON }
]

// 获取模态框标题
const getModalTitle = () => {
  const typeName = RequestValueTypeNameMap[modalConfig.valueType] || '未知'
  return `编辑 ${typeName} 内容`
}

// 获取 Monaco Editor 语言
const getMonacoLanguage = () => {
  return MonacoLanguageMap[modalConfig.valueType] || 'plaintext'
}

// 获取预览文本
const getPreviewText = (value: string) => {
  if (!value) return ''
  // 如果内容超过30个字符，显示前30个字符加省略号
  return value.length > 30 ? value.substring(0, 30) + '...' : value
}

// 打开模态框编辑器
const openModalEditor = (item: typeof defaultItem) => {
  modalConfig.show = true
  modalConfig.content = item.value
  modalConfig.valueType = item.valueType
  modalConfig.currentItem = item
  modalConfig.validationMessage = ''
  validateModalContent()
}

// 关闭模态框编辑器
const closeModalEditor = () => {
  modalConfig.show = false
  modalConfig.content = ''
  modalConfig.currentItem = null
  modalConfig.validationMessage = ''
}

// 保存模态框编辑器内容
const saveModalEditor = () => {
  if (modalConfig.currentItem) {
    modalConfig.currentItem.value = modalConfig.content
    blur()
  }
  closeModalEditor()
}

// 语法校验
const validateModalContent = () => {
  const content = modalConfig.content.trim()

  // 文本类型不需要校验
  if (modalConfig.valueType === RequestValueTypeEnum.DEFAULT) {
    modalConfig.validationMessage = ''
    modalConfig.validationType = 'success'
    return
  }

  if (!content) {
    modalConfig.validationMessage = '内容为空'
    modalConfig.validationType = 'info'
    return
  }

  switch (modalConfig.valueType) {
    case RequestValueTypeEnum.SQL:
      // SQL 基本语法检查
      if (!/^(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|DROP|ALTER)\s+/i.test(content)) {
        modalConfig.validationMessage = 'SQL 语句应以 SELECT、INSERT、UPDATE、DELETE、WITH、CREATE、DROP 或 ALTER 开头'
        modalConfig.validationType = 'warning'
      } else {
        modalConfig.validationMessage = 'SQL 语法检查通过'
        modalConfig.validationType = 'success'
      }
      break

    case RequestValueTypeEnum.JAVASCRIPT:
      // JavaScript 基本语法检查（使用 try-catch 评估）
      try {
        new Function(content)
        modalConfig.validationMessage = 'JavaScript 语法检查通过'
        modalConfig.validationType = 'success'
      } catch (err: any) {
        modalConfig.validationMessage = `JavaScript 语法错误: ${err.message}`
        modalConfig.validationType = 'error'
      }
      break

    case RequestValueTypeEnum.JSON:
      // JSON 格式检查
      try {
        JSON.parse(content)
        modalConfig.validationMessage = 'JSON 格式正确'
        modalConfig.validationType = 'success'
      } catch (err: any) {
        modalConfig.validationMessage = `JSON 格式错误: ${err.message}`
        modalConfig.validationType = 'error'
      }
      break

    default:
      modalConfig.validationMessage = ''
      modalConfig.validationType = 'success'
  }
}

// 失焦
const blur = () => {
  let successNum = 0
  let hasEmptyValue = false
  let hasEmptyKey = false

  tableArray.content.forEach(item => {
    // 只验证有 key 的项，空行不验证
    if (item.key) {
      if (item.value == '') {
        // 有 key 但 value 为空
        item.error = true
        hasEmptyValue = true
      } else {
        // 正确
        successNum++
        item.error = false
      }
    } else {
      // 没有 key 的行不标记错误
      item.error = false
      if (item.value) {
        // 有 value 但没有 key
        hasEmptyKey = true
      }
    }
  })

  // 只在有 key 的项全部验证通过时触发更新
  const validItems = tableArray.content.filter(item => item.key && item.value)
  if (successNum == validItems.length && validItems.length > 0) {
    // 转换数据成对象
    const updateObj: any = {}
    tableArray.content.forEach((e: typeof defaultItem) => {
      if (e.key && e.value) updateObj[e.key] = e.value
    })
    emits('update', updateObj)
  }
}

// 新增
const add = (index: number) => {
  tableArray.content.splice(index + 1, 0, {
    key: '',
    value: '',
    error: false,
    valueType: RequestValueTypeEnum.DEFAULT
  })
}

// 减少
const remove = (index: number) => {
  if (tableArray.content.length !== 1) {
    tableArray.content.splice(index, 1)
  }
  blur()
}

// 监听选项
watch(
  () => props.target,
  (target: RequestParamsObjType) => {
    tableArray.content = []
    for (const k in target) {
      tableArray.content.push({
        key: k,
        value: target[k],
        error: false,
        valueType: RequestValueTypeEnum.DEFAULT
      })
    }
    // 默认值
    if (!tableArray.content.length) tableArray.content = [JSON.parse(JSON.stringify(defaultItem))]
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<style lang="scss">
@include go('request-header-table-box') {
  background-color: rgba(0, 0, 0, 0);
  @include deep() {
    .n-data-table .n-data-table-td {
      background-color: rgba(0, 0, 0, 0);
    }
    .add-btn-box {
      width: 100%;
      display: flex;
      justify-content: center;
      .add-btn {
        width: 300px;
      }
    }
  }
}

// Value单元格样式
.value-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

// 模态框编辑器容器
.modal-editor-container {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .modal-type-selector {
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .validation-alert {
    margin-bottom: 0;
  }

  .editor-area {
    min-height: 400px;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
