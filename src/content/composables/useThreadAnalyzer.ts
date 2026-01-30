import { ref } from 'vue'
import type { AnalysisResult, XComment } from '../../types'

export function useThreadAnalyzer() {
  const isAnalyzing = ref(false)

  const scrapeComments = (): XComment[] => {
    const comments: XComment[] = []
    
    // X/Twitter uses article elements for tweets/comments
    const articles = document.querySelectorAll('article[data-testid="tweet"]')
    
    articles.forEach((article, index) => {
      // Skip the first one (it's the original post)
      if (index === 0) return
      
      const textEl = article.querySelector('[data-testid="tweetText"]')
      const authorEl = article.querySelector('[data-testid="User-Name"]')
      const timeEl = article.querySelector('time')
      
      // Get engagement metrics
      const likeEl = article.querySelector('[data-testid="like"]')
      const repostEl = article.querySelector('[data-testid="retweet"]')
      
      const text = textEl?.textContent || ''
      const author = authorEl?.textContent?.split('\n')[0] || 'Unknown'
      const timestamp = timeEl?.getAttribute('datetime') || ''
      
      // Parse engagement counts
      const likes = parseInt(likeEl?.textContent?.replace(/[^0-9]/g, '') || '0')
      const reposts = parseInt(repostEl?.textContent?.replace(/[^0-9]/g, '') || '0')
      
      if (text && text.length > 10) { // Filter out very short comments
        comments.push({
          id: `comment-${index}`,
          text,
          author,
          timestamp,
          likes,
          reposts,
          views: 0 // Views not always available
        })
      }
    })
    
    return comments.slice(0, 50) // Limit to 50 comments for analysis
  }

  const analyzeThread = async (): Promise<AnalysisResult> => {
    isAnalyzing.value = true
    
    try {
      const comments = scrapeComments()
      
      // Send to background script for API call
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_COMMENTS',
        payload: { comments }
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      return response.data
    } finally {
      isAnalyzing.value = false
    }
  }

  return {
    isAnalyzing,
    analyzeThread
  }
}