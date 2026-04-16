<template>
  <div class="placeholder-component">
    <div class="placeholder-content">
      <div class="placeholder-icon">⚠️</div>
      <n-text class="placeholder-title" depth="3">组件缺失</n-text>
      <n-text class="placeholder-message" depth="5">{{ option.message || '该组件不存在' }}</n-text>
      <n-text class="placeholder-info" depth="5">组件标识: {{ chartConfig.chartConfig.key }}</n-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, toRefs } from 'vue'
import { CreateComponentType } from '@/packages/index.d'

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true
  }
})

const { option } = toRefs(props.chartConfig.option)
</script>

<style lang="scss" scoped>
.placeholder-component {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 77, 79, 0.05);
  border: 2px dashed rgba(255, 77, 79, 0.3);
  border-radius: 8px;

  .placeholder-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    text-align: center;

    .placeholder-icon {
      font-size: 48px;
      line-height: 1;
    }

    .placeholder-title {
      font-size: 18px;
      font-weight: bold;
      margin-top: 12px;
      color: #ff4d4f;
    }

    .placeholder-message {
      font-size: 14px;
      margin-top: 8px;
      max-width: 300px;
      word-break: break-word;
    }

    .placeholder-info {
      font-size: 12px;
      margin-top: 12px;
      padding: 4px 8px;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      font-family: monospace;
    }
  }
}
</style>
