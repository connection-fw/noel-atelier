// Netlify Function for image generation (プロキシ)
// CORSエラーを回避するために使用

exports.handler = async (event, context) => {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // OPTIONSリクエスト（プリフライト）の処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // POSTリクエストのみ処理
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { prompt, width, height, apiType } = JSON.parse(event.body)

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' })
      }
    }

    // 環境変数からAPIキーを取得
    // Netlify Functionsでは、VITE_プレフィックスなしで環境変数を設定する必要があります
    // または、VITE_プレフィックス付きでも読み込めるように両方を試す
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.VITE_HUGGINGFACE_API_KEY || ''
    
    // APIキーの確認（デバッグ用）
    console.log('API Key present:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No')
    if (!apiKey) {
      console.warn('WARNING: No API key found. Set HUGGINGFACE_API_KEY in Netlify environment variables.')
    }
    
    // 複数のモデルを順に試す（より新しい、利用可能なモデル）
    const models = [
      'https://api-inference.huggingface.co/models/stabilityai/sdxl-turbo',
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1-base',
      'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4'
    ]
    
    let lastError = null
    
    // 各モデルを順に試す
    for (const apiUrl of models) {
      try {
        console.log(`Trying model: ${apiUrl}`)
        
        // Hugging Face APIにリクエスト
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
          },
          body: JSON.stringify({
            inputs: `${prompt}, high quality, detailed, professional photography, 8k resolution`,
            parameters: {
              width: Math.min(width || 512, 768),
              height: Math.min(height || 512, 768)
            }
          })
        })
        
        if (response.ok) {
          // 成功した場合、画像データを取得
          const imageBlob = await response.blob()
          const arrayBuffer = await imageBlob.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const mimeType = imageBlob.type || 'image/png'
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              image: `data:${mimeType};base64,${base64}`
            })
          }
        }
        
        // エラーの場合、エラー情報を取得して次のモデルを試す
        let errorText = ''
        try {
          const contentType = response.headers.get('content-type') || ''
          console.log(`Response status: ${response.status}, Content-Type: ${contentType}`)
          
          if (contentType.includes('application/json')) {
            const errorData = await response.json()
            errorText = JSON.stringify(errorData)
            console.error(`Model ${apiUrl} returned ${response.status} (JSON):`, errorText)
          } else {
            errorText = await response.text()
            console.error(`Model ${apiUrl} returned ${response.status} (Text):`, errorText.substring(0, 500))
          }
        } catch (e) {
          errorText = response.statusText || `Status ${response.status}`
          console.error(`Model ${apiUrl} returned ${response.status}, failed to read error:`, e.message)
        }
        
        lastError = { 
          status: response.status, 
          message: errorText.substring(0, 1000), // 長すぎる場合は切り詰める
          model: apiUrl
        }
        
        // 503エラー（モデルロード中）の場合は少し待ってから次のモデルを試す
        if (response.status === 503) {
          console.log(`Model ${apiUrl} is loading (503), trying next model`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (error) {
        console.error(`Error with model ${apiUrl}:`, error)
        lastError = { status: 500, message: error.message }
        continue
      }
    }
    
    // すべてのモデルが失敗した場合
    const errorDetails = lastError 
      ? `Model: ${lastError.model}\nStatus: ${lastError.status}\nMessage: ${lastError.message}`
      : 'No models available'
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'All models failed',
        message: errorDetails,
        suggestion: 'Please check your Hugging Face API key and try again later. If the problem persists, the models may be temporarily unavailable.'
      })
    }
  } catch (error) {
    console.error('Function error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    }
  }
}

