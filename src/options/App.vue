<template>
  <div class="options-container">
    <div class="options-card">
      <header>
        <h1>X Thread Analyzer</h1>
        <p>Configure your analysis settings</p>
      </header>
      
      <SettingsForm />
      
      <footer>
        <p>Version 1.0.0</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import SettingsForm from './components/SettingsForm.vue'
</script>

<style scoped>
.options-container {
  width: 100%;
  max-width: 600px;
}

.options-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

header {
  background: linear-gradient(135deg, #1d9bf0 0%, #1a8cd8 100%);
  color: white;
  padding: 32px;
  text-align: center;
}

header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

header p {
  font-size: 16px;
  opacity: 0.9;
}

footer {
  background: #f7f9f9;
  padding: 16px 32px;
  text-align: center;
  border-top: 1px solid #eff3f4;
}

footer p {
  font-size: 14px;
  color: #536471;
}
</style>