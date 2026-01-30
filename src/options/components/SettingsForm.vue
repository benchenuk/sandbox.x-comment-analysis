<template>
  <form class="settings-form" @submit.prevent="saveSettings">
    <div class="form-group">
      <label for="apiEndpoint">API Endpoint</label>
      <input
        id="apiEndpoint"
        v-model="settings.apiEndpoint"
        type="url"
        placeholder="https://api.example.com/v1/analyze"
        required
      />
      <p class="help-text">Your OpenAI-compatible API endpoint for comment analysis</p>
    </div>

    <div class="form-group">
      <label for="apiKey">API Key (Optional)</label>
      <input
        id="apiKey"
        v-model="settings.apiKey"
        type="password"
        placeholder="sk-..."
      />
      <p class="help-text">API key for authentication if required by your endpoint</p>
    </div>

    <div class="form-group">
      <label for="maxComments">Max Comments to Analyze</label>
      <input
        id="maxComments"
        v-model.number="settings.maxComments"
        type="number"
        min="10"
        max="100"
        required
      />
      <p class="help-text">Limit the number of comments sent to API (10-100)</p>
    </div>

    <div class="form-group">
      <label>Theme Preference</label>
      <div class="radio-group">
        <label class="radio-label">
          <input
            v-model="settings.theme"
            type="radio"
            value="auto"
          />
          <span>Auto (Follow X)</span>
        </label>
        <label class="radio-label">
          <input
            v-model="settings.theme"
            type="radio"
            value="light"
          />
          <span>Light</span>
        </label>
        <label class="radio-label">
          <input
            v-model="settings.theme"
            type="radio"
            value="dark"
          />
          <span>Dark</span>
        </label>
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="save-button" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : 'Save Settings' }}
      </button>
    </div>

    <div v-if="message" :class="['message', message.type]">
      {{ message.text }}
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ExtensionSettings } from '../../types'

const settings = ref<ExtensionSettings>({
  apiEndpoint: '',
  apiKey: '',
  maxComments: 50,
  theme: 'auto'
})

const isSaving = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

onMounted(async () => {
  const result = await chrome.storage.sync.get({
    apiEndpoint: '',
    apiKey: '',
    maxComments: 50,
    theme: 'auto'
  })
  settings.value = result as ExtensionSettings
})

const saveSettings = async () => {
  isSaving.value = true
  message.value = null

  try {
    await chrome.storage.sync.set(settings.value)
    message.value = { type: 'success', text: 'Settings saved successfully!' }
  } catch (error) {
    message.value = { type: 'error', text: 'Failed to save settings. Please try again.' }
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.settings-form {
  padding: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-weight: 600;
  font-size: 14px;
  color: #0f1419;
  margin-bottom: 8px;
}

.form-group input[type="url"],
.form-group input[type="password"],
.form-group input[type="number"] {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #cfd9de;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #1d9bf0;
  box-shadow: 0 0 0 2px rgba(29, 155, 240, 0.2);
}

.help-text {
  font-size: 13px;
  color: #536471;
  margin-top: 6px;
}

.radio-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 400;
}

.radio-label input {
  cursor: pointer;
}

.form-actions {
  margin-top: 32px;
}

.save-button {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #1d9bf0 0%, #1a8cd8 100%);
  color: white;
  border: none;
  border-radius: 9999px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(29, 155, 240, 0.4);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.message.success {
  background: rgba(0, 186, 124, 0.1);
  color: #00ba7c;
  border: 1px solid rgba(0, 186, 124, 0.2);
}

.message.error {
  background: rgba(244, 33, 46, 0.1);
  color: #f4212e;
  border: 1px solid rgba(244, 33, 46, 0.2);
}
</style>