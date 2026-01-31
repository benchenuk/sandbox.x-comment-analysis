<template>
  <div :class="['x-analyzer-container', theme]">
    <AnalyzerButton 
      v-if="!showSidebar"
      @click="startAnalysis"
      :is-analyzing="isAnalyzing"
    />
    <SidebarPanel
      v-if="showSidebar"
      :results="analysisResults"
      :is-loading="isAnalyzing"
      :error="error"
      :progress="progress"
      @close="showSidebar = false"
      @retry="startAnalysis"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AnalyzerButton from './components/AnalyzerButton.vue'
import SidebarPanel from './components/SidebarPanel.vue'
import { useXTheme } from './composables/useXTheme'
import { useThreadAnalyzer } from './composables/useThreadAnalyzer'
import type { AnalysisResult } from '../types'

const { theme } = useXTheme()
const { analyzeThread, isAnalyzing, error, progress } = useThreadAnalyzer()

const showSidebar = ref(false)
const analysisResults = ref<AnalysisResult | null>(null)

const startAnalysis = async () => {
  showSidebar.value = true
  analysisResults.value = null
  
  try {
    analysisResults.value = await analyzeThread()
  } catch (err) {
    // Error is already set in the composable
    console.error('[X Thread Analyzer] Analysis failed:', err)
  }
}

onMounted(() => {
  console.log('[X Thread Analyzer] Extension mounted successfully')
})
</script>