<template>
  <div class="analysis-results">
    <div class="summary-section">
      <h3>Summary</h3>
      <div class="summary-content" v-html="formatSummary(results.summary)"></div>
    </div>
    
    <div class="categories-section" v-if="results.categories.length > 0">
      <h3>Categories</h3>
      <div class="categories-list">
        <CommentCategory 
          v-for="category in results.categories" 
          :key="category.name" 
          :category="category" 
        />
      </div>
    </div>
    
    <div class="stats-section">
      <h3>Statistics</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ results.stats.totalComments }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ results.stats.filteredComments }}</span>
          <span class="stat-label">Filtered</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ results.stats.analyzedComments }}</span>
          <span class="stat-label">Analyzed</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CommentCategory from './CommentCategory.vue'
import type { AnalysisResult } from '../../types'

defineProps<{
  results: AnalysisResult
}>()

const formatSummary = (summary: string): string => {
  if (!summary) return ''
  
  // Split by newlines or periods followed by space to create bullet points
  const sentences = summary
    .split(/\n|(?<=\.\s)(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  
  if (sentences.length <= 1) {
    return summary
  }
  
  // Create bullet points
  return '<ul class="summary-list">' + 
    sentences.map(s => `<li>${s.replace(/\.$/, '')}</li>`).join('') + 
    '</ul>'
}
</script>

<style scoped>
.analysis-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-section,
.categories-section,
.stats-section {
  background: var(--x-bg-secondary, #f7f9f9);
  border-radius: 8px;
  padding: 16px;
}

h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--x-text-primary, #0f1419);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-section {
  background: var(--x-bg-secondary, #f7f9f9);
}

.summary-content {
  font-size: 15px;
  line-height: 1.6;
  color: var(--x-text-primary, #0f1419);
}

:deep(.summary-list) {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
}

:deep(.summary-list li) {
  margin-bottom: 8px;
  line-height: 1.5;
}

:deep(.summary-list li:last-child) {
  margin-bottom: 0;
}

.categories-section {
  padding: 12px 16px;
}

.categories-list {
  display: flex;
  flex-direction: column;
}

.stats-section {
  padding: 12px 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--x-primary, #1d9bf0);
}

.stat-label {
  font-size: 11px;
  color: var(--x-text-secondary, #536471);
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
</style>
