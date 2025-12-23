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
    
    // 複数のモデルを順に試す
    const models = [
      'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4',
      'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0'
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
              width: Math.min(width || 512, 512),
              height: Math.min(height || 512, 512)
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
        
        // エラーの場合、次のモデルを試す
        if (response.status !== 410 && response.status !== 404) {
          // 410や404以外のエラーは記録して次のモデルを試す
          const errorText = await response.text().catch(() => response.statusText)
          console.error(`Model ${apiUrl} returned ${response.status}:`, errorText)
          lastError = { status: response.status, message: errorText }
        } else {
          console.log(`Model ${apiUrl} returned ${response.status}, trying next model`)
        }
      } catch (error) {
        console.error(`Error with model ${apiUrl}:`, error)
        lastError = { status: 500, message: error.message }
        continue
      }
    }
    
    // すべてのモデルが失敗した場合
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'All models failed',
        message: lastError ? `Last error: ${lastError.status} - ${lastError.message}` : 'No models available',
        suggestion: 'Please check your Hugging Face API key and try again later'
      })
    }

    if (!response.ok) {
      // レスポンスのbodyを一度だけ読み込む
      let errorText
      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        try {
          const errorData = await response.json()
          errorText = JSON.stringify(errorData)
        } catch {
          errorText = `Status ${response.status}: ${response.statusText}`
        }
      } else {
        try {
          errorText = await response.text()
        } catch {
          errorText = `Status ${response.status}: ${response.statusText}`
        }
      }
      
      console.error('Hugging Face API error:', response.status, errorText)
      
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

