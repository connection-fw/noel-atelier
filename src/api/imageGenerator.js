// 画像生成APIの設定
// 実際のAPIを使用する場合は、環境変数またはこのファイルを編集してください

const API_CONFIG = {
  // 使用するAPIのタイプを選択
  // 'huggingface', 'replicate', 'stable-diffusion', 'dalle', 'placeholder'
  // 環境変数 VITE_API_TYPE で設定することも可能
  // デフォルトでHugging Face APIを試用（APIキーなしでも動作する場合があります）
  type: import.meta.env.VITE_API_TYPE || 'huggingface',
  
  // Hugging Face Inference API設定（無料枠あり）
  // https://huggingface.co/docs/api-inference/index でAPIキーを取得
  // より確実に動作するモデルに変更
  huggingface: {
    apiUrl: 'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
    apiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY || ''
  },
  
  // Replicate API設定（無料枠あり）
  // https://replicate.com/ でAPIキーを取得
  replicate: {
    apiUrl: 'https://api.replicate.com/v1/predictions',
    apiKey: import.meta.env.VITE_REPLICATE_API_KEY || '',
    model: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'
  },
  
  // Stable Diffusion API設定（Stability AI）
  stableDiffusion: {
    apiUrl: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    apiKey: import.meta.env.VITE_STABILITY_API_KEY || ''
  },
  
  // DALL-E API設定（OpenAI）
  dalle: {
    apiUrl: 'https://api.openai.com/v1/images/generations',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
  }
}

/**
 * 画像を生成する関数
 * @param {string} prompt - 生成プロンプト
 * @param {number} width - 画像の幅
 * @param {number} height - 画像の高さ
 * @returns {Promise<string>} 画像のデータURL
 */
export async function generateImage(prompt, width, height) {
  switch (API_CONFIG.type) {
    case 'huggingface':
      // Hugging Face APIはAPIキーなしでも試用可能（レート制限あり）
      try {
        return await generateWithHuggingFace(prompt, width, height)
      } catch (error) {
        // エラーをログに記録し、再スロー（App.jsxで処理）
        console.error('Image generation failed:', error)
        throw error
      }
    case 'replicate':
      if (!API_CONFIG.replicate.apiKey || API_CONFIG.replicate.apiKey === '') {
        console.warn('Replicate API key not set, falling back to placeholder')
        return generatePlaceholder(prompt, width, height)
      }
      return generateWithReplicate(prompt, width, height)
    case 'stable-diffusion':
      if (!API_CONFIG.stableDiffusion.apiKey || API_CONFIG.stableDiffusion.apiKey === '') {
        console.warn('Stable Diffusion API key not set, falling back to placeholder')
        return generatePlaceholder(prompt, width, height)
      }
      return generateWithStableDiffusion(prompt, width, height)
    case 'dalle':
      if (!API_CONFIG.dalle.apiKey || API_CONFIG.dalle.apiKey === '') {
        console.warn('DALL-E API key not set, falling back to placeholder')
        return generatePlaceholder(prompt, width, height)
      }
      return generateWithDalle(prompt, width, height)
    case 'placeholder':
    default:
      return generatePlaceholder(prompt, width, height)
  }
}

/**
 * Hugging Face Inference APIを使用して画像を生成（無料枠あり）
 * Netlify Functions経由でプロキシしてCORSエラーを回避
 */
async function generateWithHuggingFace(prompt, width, height) {
  let retryCount = 0
  const maxRetries = 3
  
  while (retryCount < maxRetries) {
    try {
      // Netlify Functions経由でリクエスト（CORSエラーを回避）
      const functionUrl = '/.netlify/functions/generate-image'
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          width: Math.min(width, 512),
          height: Math.min(height, 512),
          apiType: 'huggingface'
        })
      })
      
      if (!response.ok) {
        // レスポンスのbodyを一度だけ読み込む
        let errorData
        const contentType = response.headers.get('content-type') || ''
        
        if (contentType.includes('application/json')) {
          try {
            errorData = await response.json()
          } catch (e) {
            errorData = { error: `Status ${response.status}: ${response.statusText}` }
          }
        } else {
          try {
            const errorText = await response.text()
            errorData = { error: errorText }
          } catch (e) {
            errorData = { error: `Status ${response.status}: ${response.statusText}` }
          }
        }
        console.log(`Netlify Function response status: ${response.status}`, errorData)
        
        // モデルがロード中の場合、少し待ってから再試行
        if (response.status === 503) {
          const waitTime = (retryCount + 1) * 10 * 1000 // 10秒、20秒、30秒と増やす
          console.log(`Model is loading, waiting ${waitTime / 1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          retryCount++
          continue
        }
        
        // 429エラー（レート制限）の場合も再試行
        if (response.status === 429) {
          const waitTime = (retryCount + 1) * 5 * 1000
          console.log(`Rate limited, waiting ${waitTime / 1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          retryCount++
          continue
        }
        
        throw new Error(`API error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`)
      }
      
      // JSONレスポンスから画像データを取得
      const data = await response.json()
      
      if (data.error) {
        throw new Error(`API error: ${data.error} - ${data.details || ''}`)
      }
      
      if (!data.image || !data.image.startsWith('data:image/')) {
        throw new Error('Invalid image data received from API')
      }
      
      return data.image
    } catch (error) {
      console.error(`Hugging Face API error (attempt ${retryCount + 1}/${maxRetries}):`, error)
      retryCount++
      
      if (retryCount >= maxRetries) {
        // 最大再試行回数に達した場合、エラーをスロー（プレースホルダーにフォールバックしない）
        throw new Error(`Failed to generate image after ${maxRetries} attempts: ${error.message}`)
      }
      
      // 再試行前に少し待機
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  throw new Error('Failed to generate image: Max retries exceeded')
}

/**
 * Replicate APIを使用して画像を生成（無料枠あり）
 */
async function generateWithReplicate(prompt, width, height) {
  try {
    // 予測を作成
    const createResponse = await fetch(API_CONFIG.replicate.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${API_CONFIG.replicate.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: API_CONFIG.replicate.model.split(':')[1],
        input: {
          prompt: prompt,
          width: width,
          height: height,
          num_outputs: 1
        }
      })
    })
    
    if (!createResponse.ok) {
      throw new Error('Replicate API error: Failed to create prediction')
    }
    
    const prediction = await createResponse.json()
    
    // 予測が完了するまで待機
    let status = prediction.status
    let result = prediction
    while (status === 'starting' || status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const statusResponse = await fetch(`${API_CONFIG.replicate.apiUrl}/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${API_CONFIG.replicate.apiKey}`
        }
      })
      result = await statusResponse.json()
      status = result.status
      
      if (status === 'failed') {
        throw new Error('Replicate API error: Prediction failed')
      }
    }
    
    // 画像URLを取得してデータURLに変換
    const imageUrl = result.output[0]
    const imgResponse = await fetch(imageUrl)
    const blob = await imgResponse.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Replicate API error:', error)
    throw error
  }
}

/**
 * Stable Diffusion APIを使用して画像を生成
 */
async function generateWithStableDiffusion(prompt, width, height) {
  try {
    const response = await fetch(API_CONFIG.stableDiffusion.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.stableDiffusion.apiKey}`
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height,
        width,
        steps: 30,
        samples: 1
      })
    })
    
    if (!response.ok) {
      throw new Error('Stable Diffusion API error')
    }
    
    const data = await response.json()
    // APIのレスポンス形式に応じて調整
    const base64Image = data.artifacts?.[0]?.base64 || data.image
    if (base64Image) {
      return `data:image/png;base64,${base64Image}`
    }
    throw new Error('No image data in response')
  } catch (error) {
    console.error('Stable Diffusion API error:', error)
    throw error
  }
}

/**
 * DALL-E APIを使用して画像を生成
 */
async function generateWithDalle(prompt, width, height) {
  try {
    const response = await fetch(API_CONFIG.dalle.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.dalle.apiKey}`
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: `${width}x${height}`
      })
    })
    
    if (!response.ok) {
      throw new Error('DALL-E API error')
    }
    
    const data = await response.json()
    // DALL-Eのレスポンスから画像URLを取得
    const imageUrl = data.data[0].url
    
    // URLから画像を取得してデータURLに変換
    const imgResponse = await fetch(imageUrl)
    const blob = await imgResponse.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('DALL-E API error:', error)
    throw error
  }
}

/**
 * モチーフに応じた図形を描画する関数
 */
function drawMotif(ctx, motif, centerX, centerY, size, style) {
  const isWhite = style === 'white' || style === 'papercraft'
  const baseColor = isWhite ? '#333' : '#fff'
  const accentColor = isWhite ? '#666' : '#ffd700'
  
  ctx.save()
  ctx.translate(centerX, centerY)
  
  // モチーフ名を小文字に変換して判定
  const motifLower = motif.toLowerCase()
  
  if (motifLower.includes('tree') || motifLower.includes('ツリー')) {
    // クリスマスツリー
    drawChristmasTree(ctx, 0, 0, size, baseColor, accentColor)
  } else if (motifLower.includes('star') || motifLower.includes('星')) {
    // 星
    drawStar(ctx, 0, 0, size, baseColor, accentColor)
  } else if (motifLower.includes('snowflake') || motifLower.includes('雪') || motifLower.includes('結晶')) {
    // 雪の結晶
    drawSnowflake(ctx, 0, 0, size, baseColor)
  } else if (motifLower.includes('bell') || motifLower.includes('ベル')) {
    // ベル
    drawBell(ctx, 0, 0, size, baseColor, accentColor)
  } else if (motifLower.includes('wreath') || motifLower.includes('リース')) {
    // リース
    drawWreath(ctx, 0, 0, size, baseColor, accentColor)
  } else if (motifLower.includes('santa') || motifLower.includes('サンタ')) {
    // サンタクロース
    drawSanta(ctx, 0, 0, size, baseColor, accentColor)
  } else if (motifLower.includes('reindeer') || motifLower.includes('トナカイ')) {
    // トナカイ
    drawReindeer(ctx, 0, 0, size, baseColor, accentColor)
  } else if (motifLower.includes('present') || motifLower.includes('プレゼント') || motifLower.includes('gift')) {
    // プレゼント
    drawPresent(ctx, 0, 0, size, baseColor, accentColor)
  } else if (motifLower.includes('candle') || motifLower.includes('キャンドル')) {
    // キャンドル
    drawCandle(ctx, 0, 0, size, baseColor, accentColor)
  } else if (motifLower.includes('ornament') || motifLower.includes('ball') || motifLower.includes('ボール')) {
    // オーナメントボール
    drawOrnamentBall(ctx, 0, 0, size, baseColor, accentColor)
  } else {
    // デフォルト：装飾的な円
    drawDefaultOrnament(ctx, 0, 0, size, baseColor, accentColor)
  }
  
  ctx.restore()
}

/**
 * クリスマスツリーを描画
 */
function drawChristmasTree(ctx, x, y, size, baseColor, accentColor) {
  const treeSize = size * 0.6
  const trunkWidth = treeSize * 0.15
  const trunkHeight = treeSize * 0.2
  
  // ツリーの三角形（3段）
  ctx.fillStyle = baseColor
  ctx.beginPath()
  // 上段
  ctx.moveTo(x, y - treeSize / 2)
  ctx.lineTo(x - treeSize * 0.3, y - treeSize * 0.1)
  ctx.lineTo(x + treeSize * 0.3, y - treeSize * 0.1)
  ctx.closePath()
  ctx.fill()
  
  // 中段
  ctx.beginPath()
  ctx.moveTo(x, y - treeSize * 0.15)
  ctx.lineTo(x - treeSize * 0.4, y + treeSize * 0.15)
  ctx.lineTo(x + treeSize * 0.4, y + treeSize * 0.15)
  ctx.closePath()
  ctx.fill()
  
  // 下段
  ctx.beginPath()
  ctx.moveTo(x, y + treeSize * 0.1)
  ctx.lineTo(x - treeSize * 0.5, y + treeSize * 0.4)
  ctx.lineTo(x + treeSize * 0.5, y + treeSize * 0.4)
  ctx.closePath()
  ctx.fill()
  
  // 幹
  ctx.fillStyle = accentColor
  ctx.fillRect(x - trunkWidth / 2, y + treeSize * 0.4, trunkWidth, trunkHeight)
  
  // 装飾（星や丸）
  ctx.fillStyle = accentColor
  ctx.beginPath()
  ctx.arc(x, y - treeSize / 2, size * 0.05, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x - treeSize * 0.2, y, size * 0.04, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x + treeSize * 0.2, y + treeSize * 0.1, size * 0.04, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * 星を描画
 */
function drawStar(ctx, x, y, size, baseColor, accentColor) {
  const starSize = size * 0.5
  const spikes = 5
  const outerRadius = starSize / 2
  const innerRadius = outerRadius * 0.4
  
  ctx.fillStyle = accentColor
  ctx.strokeStyle = baseColor
  ctx.lineWidth = size * 0.02
  
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    const px = x + radius * Math.cos(angle)
    const py = y + radius * Math.sin(angle)
    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

/**
 * 雪の結晶を描画
 */
function drawSnowflake(ctx, x, y, size, baseColor) {
  const armLength = size * 0.3
  const arms = 6
  
  ctx.strokeStyle = baseColor
  ctx.lineWidth = size * 0.02
  ctx.lineCap = 'round'
  
  for (let i = 0; i < arms; i++) {
    const angle = (i * Math.PI * 2) / arms
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    
    // 主軸
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -armLength)
    ctx.stroke()
    
    // 側枝
    for (let j = 1; j <= 2; j++) {
      const branchY = -armLength * (j / 3)
      const branchLength = armLength * 0.3
      ctx.beginPath()
      ctx.moveTo(0, branchY)
      ctx.lineTo(-branchLength * 0.6, branchY - branchLength * 0.3)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, branchY)
      ctx.lineTo(branchLength * 0.6, branchY - branchLength * 0.3)
      ctx.stroke()
    }
    
    ctx.restore()
  }
}

/**
 * ベルを描画
 */
function drawBell(ctx, x, y, size, baseColor, accentColor) {
  const bellSize = size * 0.5
  
  // ベル本体
  ctx.fillStyle = accentColor
  ctx.strokeStyle = baseColor
  ctx.lineWidth = size * 0.02
  
  ctx.beginPath()
  ctx.arc(x, y, bellSize / 2, 0, Math.PI, true)
  ctx.lineTo(x - bellSize / 2, y + bellSize * 0.3)
  ctx.lineTo(x + bellSize / 2, y + bellSize * 0.3)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  
  // ベルの中の線
  ctx.strokeStyle = baseColor
  ctx.beginPath()
  ctx.arc(x, y, bellSize * 0.3, 0, Math.PI)
  ctx.stroke()
  
  // 上部のループ
  ctx.fillStyle = baseColor
  ctx.beginPath()
  ctx.arc(x, y - bellSize / 2, bellSize * 0.15, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * リースを描画
 */
function drawWreath(ctx, x, y, size, baseColor, accentColor) {
  const radius = size * 0.3
  
  // リースの輪
  ctx.strokeStyle = baseColor
  ctx.lineWidth = size * 0.08
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.stroke()
  
  // 装飾（ベリー）
  ctx.fillStyle = accentColor
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6
    const berryX = x + radius * 0.7 * Math.cos(angle)
    const berryY = y + radius * 0.7 * Math.sin(angle)
    ctx.beginPath()
    ctx.arc(berryX, berryY, size * 0.04, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * サンタクロースを描画（簡易版）
 */
function drawSanta(ctx, x, y, size, baseColor, accentColor) {
  const santaSize = size * 0.5
  
  // 帽子
  ctx.fillStyle = accentColor
  ctx.beginPath()
  ctx.arc(x, y - santaSize * 0.3, santaSize * 0.25, 0, Math.PI * 2)
  ctx.fill()
  
  // 顔
  ctx.fillStyle = baseColor
  ctx.beginPath()
  ctx.arc(x, y, santaSize * 0.2, 0, Math.PI * 2)
  ctx.fill()
  
  // ひげ
  ctx.strokeStyle = baseColor
  ctx.lineWidth = size * 0.02
  ctx.beginPath()
  ctx.arc(x, y + santaSize * 0.1, santaSize * 0.15, Math.PI, 0)
  ctx.stroke()
}

/**
 * トナカイを描画（簡易版）
 */
function drawReindeer(ctx, x, y, size, baseColor, accentColor) {
  const reindeerSize = size * 0.4
  
  // 体
  ctx.fillStyle = baseColor
  ctx.beginPath()
  ctx.ellipse(x, y, reindeerSize * 0.3, reindeerSize * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // 頭
  ctx.beginPath()
  ctx.arc(x - reindeerSize * 0.2, y - reindeerSize * 0.1, reindeerSize * 0.15, 0, Math.PI * 2)
  ctx.fill()
  
  // 角
  ctx.strokeStyle = accentColor
  ctx.lineWidth = size * 0.02
  ctx.beginPath()
  ctx.moveTo(x - reindeerSize * 0.25, y - reindeerSize * 0.2)
  ctx.lineTo(x - reindeerSize * 0.35, y - reindeerSize * 0.35)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x - reindeerSize * 0.15, y - reindeerSize * 0.2)
  ctx.lineTo(x - reindeerSize * 0.25, y - reindeerSize * 0.35)
  ctx.stroke()
}

/**
 * プレゼントを描画
 */
function drawPresent(ctx, x, y, size, baseColor, accentColor) {
  const boxSize = size * 0.4
  
  // 箱
  ctx.fillStyle = accentColor
  ctx.fillRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize)
  
  // リボン（縦）
  ctx.fillStyle = baseColor
  ctx.fillRect(x - boxSize * 0.05, y - boxSize / 2, boxSize * 0.1, boxSize)
  
  // リボン（横）
  ctx.fillRect(x - boxSize / 2, y - boxSize * 0.05, boxSize, boxSize * 0.1)
  
  // リボンの結び目
  ctx.beginPath()
  ctx.arc(x, y, boxSize * 0.15, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * キャンドルを描画
 */
function drawCandle(ctx, x, y, size, baseColor, accentColor) {
  const candleWidth = size * 0.15
  const candleHeight = size * 0.4
  
  // キャンドル本体
  ctx.fillStyle = baseColor
  ctx.fillRect(x - candleWidth / 2, y - candleHeight / 2, candleWidth, candleHeight)
  
  // 炎
  ctx.fillStyle = accentColor
  ctx.beginPath()
  ctx.ellipse(x, y - candleHeight / 2, candleWidth * 0.3, candleWidth * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // 芯
  ctx.strokeStyle = baseColor
  ctx.lineWidth = size * 0.01
  ctx.beginPath()
  ctx.moveTo(x, y - candleHeight / 2)
  ctx.lineTo(x, y - candleHeight / 2 - candleWidth * 0.5)
  ctx.stroke()
}

/**
 * オーナメントボールを描画
 */
function drawOrnamentBall(ctx, x, y, size, baseColor, accentColor) {
  const ballSize = size * 0.4
  
  // ボール本体
  const gradient = ctx.createRadialGradient(x - ballSize * 0.2, y - ballSize * 0.2, 0, x, y, ballSize / 2)
  gradient.addColorStop(0, accentColor)
  gradient.addColorStop(1, baseColor)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, ballSize / 2, 0, Math.PI * 2)
  ctx.fill()
  
  // 上部のループ
  ctx.fillStyle = baseColor
  ctx.beginPath()
  ctx.arc(x, y - ballSize / 2, ballSize * 0.1, 0, Math.PI * 2)
  ctx.fill()
  
  // ハイライト
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.beginPath()
  ctx.arc(x - ballSize * 0.15, y - ballSize * 0.15, ballSize * 0.1, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * デフォルトのオーナメントを描画
 */
function drawDefaultOrnament(ctx, x, y, size, baseColor, accentColor) {
  const radius = size * 0.3
  
  // 外側の円
  ctx.strokeStyle = baseColor
  ctx.lineWidth = size * 0.03
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.stroke()
  
  // 内側の装飾
  ctx.fillStyle = accentColor
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * プレースホルダー画像を生成（デモ用）
 */
function generatePlaceholder(prompt, width, height) {
  return new Promise((resolve, reject) => {
    try {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          throw new Error('Canvas context could not be created')
        }
        
        // スタイルに応じた背景色を決定
        let bgGradient
        let styleType = 'default'
        
        if (prompt.includes('white papercraft') || prompt.includes('monochrome white')) {
          // ペーパークラフトは白背景
          bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
          bgGradient.addColorStop(0, '#f8f8f8')
          bgGradient.addColorStop(1, '#e8e8e8')
          styleType = 'white'
        } else if (prompt.includes('crystal') || prompt.includes('glass')) {
          // クリスタルガラスは青系
          bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
          bgGradient.addColorStop(0, '#e3f2fd')
          bgGradient.addColorStop(1, '#bbdefb')
          styleType = 'crystal'
        } else if (prompt.includes('Pixar') || prompt.includes('3D')) {
          // 3Dアニメーションは鮮やかな色
          bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
          bgGradient.addColorStop(0, '#fff3e0')
          bgGradient.addColorStop(1, '#ffe0b2')
          styleType = '3d'
        } else {
          // デフォルトは紫系
          bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
          bgGradient.addColorStop(0, '#667eea')
          bgGradient.addColorStop(1, '#764ba2')
        }
        
        ctx.fillStyle = bgGradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // モチーフ名を抽出（プロンプトの最初の部分）
        const motifMatch = prompt.match(/^([^,]+),/)
        const motifText = motifMatch ? motifMatch[1].trim() : 'Ornament'
        
        // モチーフに応じた図形を描画
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const motifSize = Math.min(width, height) * 0.6
        
        drawMotif(ctx, motifText, centerX, centerY, motifSize, styleType)
        
        const dataURL = canvas.toDataURL('image/png')
        if (!dataURL || dataURL === 'data:,') {
          throw new Error('Failed to generate image data URL')
        }
        
        console.log('Generated placeholder image:', { prompt, motif: motifText, width, height, dataURLLength: dataURL.length })
        resolve(dataURL)
      } catch (error) {
        console.error('Error generating placeholder image:', error)
        reject(error)
      }
    } catch (error) {
      console.error('Error in generatePlaceholder:', error)
      reject(error)
    }
  })
}

