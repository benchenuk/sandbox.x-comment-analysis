import type { XComment, AnalysisResult } from '../types'

interface AnalyzeRequest {
  type: 'ANALYZE_COMMENTS'
  payload: {
    comments: XComment[]
  }
}

// Get settings from storage
const getSettings = async () => {
  const result = await chrome.storage.sync.get({
    apiEndpoint: '',
    apiKey: '',
    model: 'gpt-4',
    maxComments: 50,
    requestTimeout: 30000 // 30 seconds default
  })
  return result
}

/**
 * Build full API URL from base endpoint
 * Auto-appends /chat/completions if not present
 */
const buildApiUrl = (baseEndpoint: string): string => {
  // Remove trailing slash if present
  let url = baseEndpoint.trim().replace(/\/$/, '')
  
  // If URL doesn't end with /chat/completions, append it
  if (!url.endsWith('/chat/completions')) {
    // Check if it ends with /v1, if so append /chat/completions
    if (url.endsWith('/v1')) {
      url = `${url}/chat/completions`
    } else {
      // Assume it's a base URL and append the full path
      url = `${url}/v1/chat/completions`
    }
  }
  
  return url
}

/**
 * Fetch with timeout support
 */
const fetchWithTimeout = async (
  url: string, 
  options: RequestInit, 
  timeout: number
): Promise<Response> => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Call external API with retry logic
 */
const analyzeComments = async (comments: XComment[]): Promise<AnalysisResult> => {
  const settings = await getSettings()
  
  if (!settings.apiEndpoint) {
    throw new Error('API endpoint not configured. Please set it in extension options.')
  }
  
  // Validate URL format
  try {
    new URL(settings.apiEndpoint)
  } catch {
    throw new Error('Invalid API endpoint URL. Please check your settings.')
  }
  
  const maxRetries = 2
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[X Thread Analyzer] API call attempt ${attempt + 1}/${maxRetries + 1}`)
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
      
      if (settings.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`
      }
      
      const requestBody = {
        model: settings.model || 'gpt-4', // Use configured model or default
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing social media comments. Analyze the provided X/Twitter thread comments and provide:
1. A concise summary (2-3 sentences)
2. Categories of comments (e.g., "Support", "Questions", "Criticism", "Off-topic", "Bot/Spam")
3. Identification of potential bots/trolls
4. Key insights and sentiment

Return JSON format only with these fields:
- summary: string
- categories: array of {name, icon, comments}
- filteredCount: number (bots/trolls filtered)
- analyzedCount: number (total analyzed)`
          },
          {
            role: 'user',
            content: `Analyze these ${comments.length} comments from an X/Twitter thread:\n\n${
              comments.map((c, i) => 
                `${i + 1}. ${c.author}: "${c.text}" (❤️ ${c.likes} 🔄 ${c.reposts})`
              ).join('\n')
            }`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }
      
      // Build full API URL (auto-appends /chat/completions if needed)
      const apiUrl = buildApiUrl(settings.apiEndpoint)
      console.log(`[X Thread Analyzer] Using API URL: ${apiUrl}`)
      
      const response = await fetchWithTimeout(
        apiUrl,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        },
        settings.requestTimeout
      )
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        let errorMessage = `API error: ${response.status} ${response.statusText}`
        
        // Provide user-friendly error messages
        if (response.status === 401) {
          errorMessage = 'API authentication failed. Please check your API key.'
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
        } else if (response.status >= 500) {
          errorMessage = 'API server error. Please try again later.'
        }
        
        throw new Error(`${errorMessage}${errorText ? ` - ${errorText}` : ''}`)
      }
      
      const data = await response.json()
      
      // Parse OpenAI-style response
      let analysisData: AnalysisResult
      
      if (data.choices && data.choices[0]?.message?.content) {
        // OpenAI/compatible API format
        const content = data.choices[0].message.content
        
        // Try to parse JSON from content
        try {
          const parsed = JSON.parse(content)
          analysisData = {
            summary: parsed.summary || 'Analysis completed',
            categories: parsed.categories || [{
              name: 'General Discussion',
              icon: '💬',
              comments: comments.slice(0, 5).map(c => ({ ...c, category: 'general' }))
            }],
            stats: {
              totalComments: comments.length,
              filteredComments: parsed.filteredCount || 0,
              analyzedComments: parsed.analyzedCount || comments.length
            }
          }
        } catch {
          // If not JSON, use content as summary
          analysisData = {
            summary: content,
            categories: [{
              name: 'All Comments',
              icon: '💬',
              comments: comments.slice(0, 10).map(c => ({ ...c, category: 'general' }))
            }],
            stats: {
              totalComments: comments.length,
              filteredComments: 0,
              analyzedComments: comments.length
            }
          }
        }
      } else {
        // Direct API response format
        analysisData = {
          summary: data.summary || 'Analysis completed',
          categories: data.categories || [{
            name: 'General Discussion',
            icon: '💬',
            comments: comments.slice(0, 5).map(c => ({ ...c, category: 'general' }))
          }],
          stats: {
            totalComments: comments.length,
            filteredComments: data.filteredCount || 0,
            analyzedComments: data.analyzedCount || comments.length
          }
        }
      }
      
      console.log('[X Thread Analyzer] API call successful')
      return analysisData
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`[X Thread Analyzer] API attempt ${attempt + 1} failed:`, lastError.message)
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        break
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000
        console.log(`[X Thread Analyzer] Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error('Failed to analyze comments after multiple attempts')
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request: AnalyzeRequest, _sender, sendResponse) => {
  if (request.type === 'ANALYZE_COMMENTS') {
    console.log(`[X Thread Analyzer] Received ${request.payload.comments.length} comments for analysis`)
    
    analyzeComments(request.payload.comments)
      .then(result => {
        console.log('[X Thread Analyzer] Analysis successful')
        sendResponse({ data: result })
      })
      .catch(error => {
        console.error('[X Thread Analyzer] Analysis failed:', error.message)
        sendResponse({ 
          error: error.message,
          code: error.name || 'ANALYSIS_ERROR'
        })
      })
    
    return true // Keep message channel open for async
  }
})

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[X Thread Analyzer] Extension installed', details.reason)
  
  // Set default settings on install
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      apiEndpoint: '',
      apiKey: '',
      model: 'gpt-4',
      maxComments: 50,
      theme: 'auto',
      requestTimeout: 30000
    })
  }
})

// Handle extension icon click
chrome.action?.onClicked?.addListener(() => {
  // Open options page
  chrome.runtime.openOptionsPage()
})