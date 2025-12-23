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
    // より確実に動作するモデルに変更（Stable Diffusion XL）
    const apiUrl = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0'

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
          width: Math.min(width || 1024, 1024),
          height: Math.min(height || 1024, 1024)
        }
      })
    })

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
      
      // 503エラー（モデルロード中）の場合は、クライアントに再試行を促す
      if (response.status === 503) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            error: 'Model is loading',
            message: 'The model is currently loading. Please try again in a few seconds.',
            retryAfter: 10
          })
        }
      }
      
      // 410エラー（モデルが存在しない）の場合、別のモデルを試す
      if (response.status === 410) {
        console.error('Model not found (410), trying alternative model')
        // 代替モデルを試す
        const altApiUrl = 'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4'
        const altResponse = await fetch(altApiUrl, {
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
        
        if (altResponse.ok) {
          const altImageBlob = await altResponse.blob()
          const altArrayBuffer = await altImageBlob.arrayBuffer()
          const altBase64 = Buffer.from(altArrayBuffer).toString('base64')
          const altMimeType = altImageBlob.type || 'image/png'
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              image: `data:${altMimeType};base64,${altBase64}`
            })
          }
        }
      }
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `API error: ${response.status}`,
          details: errorText
        })
      }
    }

    // 画像データを取得
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

