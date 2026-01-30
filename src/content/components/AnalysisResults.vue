<template>
  <div class="analysis-results">
    <div class="summary-section">
      <h3>Summary</h3>
      <p>{{ results.summary }}</p>
    </div>
    
    <div class="categories-section">
      <h3>Categories</h3>
      <div v-for="category in results.categories" :key="category.name" class="category">
        <CommentCategory :category="category" />
      </div>
    </div>
    
    <div class="stats-section">
      <h3>Statistics</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ results.stats.totalComments }}</span>
          <span class="stat-label">Total Comments</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ results.stats.filteredComments }}</span>
          <span class="stat-label">Filtered (Bots/Trolls)</span>
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
</script>

<style scoped>
.analysis-results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-section,
.categories-section,
.stats-section {
  background: var(--x-bg-secondary, #f7f9f9);
  border-radius: 12px;
  padding: 16px;
}

h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--x-text-primary, #0f1419);
}

.summary-section p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--x-text-secondary, #536471);
}

.category {
  margin-bottom: 12px;
}

.category:last-child {
  margin-bottom: 0;
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
  font-size: 24px;
  font-weight: 700;
  color: var(--x-primary, #1d9bf0);
}

.stat-label {
  font-size: 12px;
  color: var(--x-text-secondary, #536471);
  margin-top: 4px;
}
</style>