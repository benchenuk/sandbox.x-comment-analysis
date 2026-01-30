<template>
  <form class="settings-form" @submit.prevent="saveSettings">
    <div class="form-section">
      <h3>API Configuration</h3>
      
      <div class="form-group">
        <label for="apiEndpoint">API Base URL *</label>
        <input
          id="apiEndpoint"
          v-model="settings.apiEndpoint"
          type="url"
          placeholder="https://api.openai.com/v1"
          required
        />
        <p class="help-text">
          Examples: <code>https://api.openai.com/v1</code>, <code>http://localhost:1234/v1</code>
        </p>
      </div>

      <div class="form-row">
        <div class="form-group half">
          <label for="apiKey">API Key</label>
          <input
            id="apiKey"
            v-model="settings.apiKey"
            type="password"
            placeholder="sk-..."
          />
          <p class="help-text">API key for authentication</p>
        </div>

        <div class="form-group half">
          <label for="model">Model</label>
          <input
            id="model"
            v-model="settings.model"
            type="text"
            placeholder="gpt-4"
          />
          <p class="help-text">Model name (e.g., gpt-4, gpt-3.5-turbo)</p>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group half">
          <label for="maxComments">Max Comments</label>
          <input
            id="maxComments"
            v-model.number="settings.maxComments"
            type="number"
            min="10"
            max="100"
            required
          />
          <p class="help-text">10-100 comments</p>
        </div>

        <div class="form-group half">
          <label for="requestTimeout">Timeout (ms)</label>
          <input
            id="requestTimeout"
            v-model.number="settings.requestTimeout"
            type="number"
            min="5000"
            max="120000"
            step="1000"
            required
          />
          <p class="help-text">5-120 seconds</p>
        </div>
      </div>

      <div class="form-group">
        <button 
          type="button" 
          class="test-button"
          @click="testConnection"
          :disabled="isTesting || !settings.apiEndpoint"
        >
          <span v-if="isTesting" class="spinner"></span>
          {{ isTesting ? 'Testing...' : 'Test Connection' }}
        </button>
        <p v-if="testResult" :class="['test-result', testResult.type]">
          {{ testResult.message }}
        </p>
      </div>
    </div>

    <div class="form-section">
      <h3>Appearance</h3>
      
      <div class="form-group">
        <label>Theme Preference</label>
        <div class="radio-group">
          <label class="radio-label">
            <input
              v-model="settings.theme"
              type="radio"
              value="auto"
            />
            <span>🌓 Auto (Follow X)</span>
          </label>
          <label class="radio-label">
            <input
              v-model="settings.theme"
              type="radio"
              value="light"
            />
            <span>☀️ Light</span>
          </label>
          <label class="radio-label">
            <input
              v-model="settings.theme"
              type="radio"
              value="dark"
            />
            <span>🌙 Dark</span>
          </label>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="save-button" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : 'Save Settings' }}
      </button>
      <button 
        type="button" 
        class="reset-button"
        @click="resetSettings"
        :disabled="isSaving"
      >
        Reset to Defaults
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

const defaultSettings: ExtensionSettings = {
  apiEndpoint: '',
  apiKey: '',
  model: 'gpt-4',
  maxComments: 50,
  theme: 'auto',
  requestTimeout: 30000
}

const settings = ref<ExtensionSettings>({ ...defaultSettings })

const isSaving = ref(false)
const isTesting = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const testResult = ref<{ type: 'success' | 'error'; message: string } | null>(null)

onMounted(async () => {
  const result = await chrome.storage.sync.get(defaultSettings)
  settings.value = result as ExtensionSettings
})

const saveSettings = async () => {
  isSaving.value = true
  message.value = null

  try {
    await chrome.storage.sync.set(settings.value)
    message.value = { type: 'success', text: 'Settings saved successfully!' }
    
    // Clear message after 3 seconds
    setTimeout(() => {
      message.value = null
    }, 3000)
  } catch (error) {
    message.value = { type: 'error', text: 'Failed to save settings. Please try again.' }
  } finally {
    isSaving.value = false
  }
}

const resetSettings = async () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    settings.value = { ...defaultSettings }
    await saveSettings()
  }
}

// Helper to build full API URL (same logic as service worker)
const buildApiUrl = (baseEndpoint: string): string => {
  let url = baseEndpoint.trim().replace(/\/$/, '')
  if (!url.endsWith('/chat/completions')) {
    if (url.endsWith('/v1')) {
      url = `${url}/chat/completions`
    } else {
      url = `${url}/v1/chat/completions`
    }
  }
  return url
}

const testConnection = async () => {
  isTesting.value = true
  testResult.value = null

  try {
    // Build full API URL
    const apiUrl = buildApiUrl(settings.value.apiEndpoint)
    
    // Now try a minimal POST request to chat/completions
    // Use a very simple request that won't crash the server
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout for test
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': settings.value.apiKey ? `Bearer ${settings.value.apiKey}` : ''
      },
      body: JSON.stringify({
        model: settings.value.model || 'gpt-4',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
        temperature: 0
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (response.ok) {
      testResult.value = { 
        type: 'success', 
        message: '✓ Connection successful! API is reachable and credentials are valid.' 
      }
    } else if (response.status === 401) {
      testResult.value = { 
        type: 'error', 
        message: '✗ Authentication failed (401). Please check your API key.' 
      }
    } else if (response.status === 404) {
      testResult.value = { 
        type: 'error', 
        message: `✗ Endpoint not found (404). Please check your API URL. Tried: ${apiUrl}` 
      }
    } else if (response.status === 429) {
      testResult.value = { 
        type: 'error', 
        message: '✗ Rate limited (429). Please wait a moment and try again.' 
      }
    } else {
      const errorText = await response.text().catch(() => 'Unknown error')
      testResult.value = { 
        type: 'error', 
        message: `✗ Connection failed: ${response.status} ${response.statusText}. ${errorText.slice(0, 100)}` 
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      testResult.value = { 
        type: 'error', 
        message: '✗ Connection timed out after 10 seconds. Server may be unreachable.' 
      }
    } else {
      testResult.value = { 
        type: 'error', 
        message: `✗ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  } finally {
    isTesting.value = false
  }
}
</script>

<style scoped>
.settings-form {
  padding: 32px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  font-size: 18px;
  font-weight: 700;
  color: #0f1419;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eff3f4;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group.half {
  flex: 1;
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
.form-group input[type="text"],
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
  gap: 24px;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 400;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.radio-label:hover {
  background: rgba(0, 0, 0, 0.05);
}

.radio-label input {
  cursor: pointer;
}

.test-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #f7f9f9;
  border: 1px solid #cfd9de;
  border-radius: 9999px;
  color: #0f1419;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.test-button:hover:not(:disabled) {
  background: #eff3f4;
  border-color: #1d9bf0;
}

.test-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #1d9bf0;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.test-result {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
}

.test-result.success {
  background: rgba(0, 186, 124, 0.1);
  color: #00ba7c;
  border: 1px solid rgba(0, 186, 124, 0.2);
}

.test-result.error {
  background: rgba(244, 33, 46, 0.1);
  color: #f4212e;
  border: 1px solid rgba(244, 33, 46, 0.2);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #eff3f4;
}

.save-button {
  flex: 1;
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

.reset-button {
  padding: 14px 24px;
  background: transparent;
  border: 1px solid #cfd9de;
  border-radius: 9999px;
  color: #536471;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
  border-color: #536471;
}

.reset-button:disabled {
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