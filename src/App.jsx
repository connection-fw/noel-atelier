import { useState, useEffect } from 'react'
import './App.css'
import { generateImage } from './api/imageGenerator'

const STYLES = [
  {
    id: 'crystal',
    name: 'クリスタルガラス',
    prompt: 'delicate transparent glass ornament, crystal clear, intricate details, elegant, Christmas decoration'
  },
  {
    id: 'cinematic',
    name: 'シネマティック 3D アニメーション',
    prompt: 'Pixar-style 3D rendered ornament, cinematic lighting, vibrant colors, smooth surfaces, Christmas decoration'
  },
  {
    id: 'snowglobe',
    name: 'ガラススノードーム',
    prompt: 'glass snow globe ornament, snowflakes inside, Christmas scene, vintage style, elegant'
  },
  {
    id: 'papercraft',
    name: 'ペーパークラフト',
    prompt: 'white papercraft ornament, intricate layered paper design, origami style, minimalist white only, monochrome white, no colors, pure white paper, Christmas decoration'
  }
]

const RANDOM_MOTIFS = [
  'クリスマスツリー',
  '星',
  '雪の結晶',
  'ベル',
  'リース',
  'サンタクロース',
  'トナカイ',
  'プレゼント',
  'キャンドル',
  'オーナメントボール'
]

const SIZE_OPTIONS = [
  { value: 'square', label: '正方形', width: 1024, height: 1024 },
  { value: 'vertical', label: '9:16 縦長', width: 576, height: 1024 },
  { value: 'horizontal', label: '16:9 横長', width: 1024, height: 576 }
]

const MAX_GENERATIONS_PER_DAY = 5

function App() {
  const [selectedSize, setSelectedSize] = useState('square')
  const [motif, setMotif] = useState('')
  const [generatedImages, setGeneratedImages] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationsLeft, setGenerationsLeft] = useState(MAX_GENERATIONS_PER_DAY)
  const [showRegenerate, setShowRegenerate] = useState(false)

  useEffect(() => {
    loadDailyCount()
  }, [])

  const getTodayString = () => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }

  const loadDailyCount = () => {
    const today = getTodayString()
    const stored = localStorage.getItem('noel_atelier_daily')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.date === today) {
          const remaining = MAX_GENERATIONS_PER_DAY - data.count
          setGenerationsLeft(remaining > 0 ? remaining : 0)
        } else {
          // 新しい日なのでリセット
          localStorage.setItem('noel_atelier_daily', JSON.stringify({ date: today, count: 0 }))
          setGenerationsLeft(MAX_GENERATIONS_PER_DAY)
        }
      } catch (error) {
        // データが破損している場合はリセット
        localStorage.setItem('noel_atelier_daily', JSON.stringify({ date: today, count: 0 }))
        setGenerationsLeft(MAX_GENERATIONS_PER_DAY)
      }
    } else {
      setGenerationsLeft(MAX_GENERATIONS_PER_DAY)
    }
  }

  const incrementDailyCount = () => {
    const today = getTodayString()
    const stored = localStorage.getItem('noel_atelier_daily')
    let data
    
    try {
      data = stored ? JSON.parse(stored) : { date: today, count: 0 }
    } catch (error) {
      data = { date: today, count: 0 }
    }
    
    if (data.date !== today) {
      data = { date: today, count: 0 }
    }
    
    data.count += 1
    localStorage.setItem('noel_atelier_daily', JSON.stringify(data))
    const remaining = MAX_GENERATIONS_PER_DAY - data.count
    setGenerationsLeft(remaining > 0 ? remaining : 0)
  }

  const generateImageForStyle = async (style, motifText) => {
    try {
      const size = SIZE_OPTIONS.find(s => s.value === selectedSize)
      if (!size) {
        throw new Error('Size option not found')
      }
      
      const styleObj = STYLES.find(s => s.id === style)
      if (!styleObj) {
        throw new Error('Style not found')
      }
      
      const stylePrompt = styleObj.prompt
      
      // モチーフを英語に翻訳（簡易版、実際の実装では翻訳APIを使用）
      const motifEnglish = translateMotifToEnglish(motifText)
      const prompt = `${motifEnglish}, ${stylePrompt}`
      
      const imageUrl = await generateImage(prompt, size.width, size.height)
      if (!imageUrl) {
        throw new Error('Image generation returned empty result')
      }
      
      return imageUrl
    } catch (error) {
      console.error(`Error generating image for style ${style}:`, error)
      throw error
    }
  }

  const translateMotifToEnglish = (motif) => {
    // 簡易的な翻訳マッピング（実際の実装では翻訳APIを使用）
    const translations = {
      'クリスマスツリー': 'Christmas tree',
      '星': 'star',
      '雪の結晶': 'snowflake',
      'ベル': 'bell',
      'リース': 'wreath',
      'サンタクロース': 'Santa Claus',
      'トナカイ': 'reindeer',
      'プレゼント': 'present',
      'キャンドル': 'candle',
      'オーナメントボール': 'ornament ball'
    }
    return translations[motif] || motif
  }

  const handleGenerate = async (useRandomMotif = false) => {
    if (generationsLeft <= 0) {
      alert('本日の生成回数の上限に達しました。明日またお試しください。')
      return
    }

    const motifText = useRandomMotif 
      ? RANDOM_MOTIFS[Math.floor(Math.random() * RANDOM_MOTIFS.length)]
      : motif.trim()

    if (!motifText) {
      alert('モチーフを入力してください。')
      return
    }

    setIsGenerating(true)
    setShowRegenerate(false)
    setGeneratedImages([])

    try {
      const images = await Promise.all(
        STYLES.map(style => generateImageForStyle(style.id, motifText))
      )

      console.log('Generated images:', images.map((url, index) => ({
        index,
        style: STYLES[index].name,
        urlLength: url ? url.length : 0,
        urlPrefix: url ? url.substring(0, 50) : 'null'
      })))

      // 画像URLの検証
      const validImages = images.filter(url => url && (url.startsWith('data:image') || url.startsWith('blob:')))
      if (validImages.length !== images.length) {
        console.warn('Some images failed to generate:', {
          total: images.length,
          valid: validImages.length,
          invalid: images.filter(url => !url || (!url.startsWith('data:image') && !url.startsWith('blob:')))
        })
      }

      if (validImages.length === 0) {
        throw new Error('No images were generated successfully')
      }

      setGeneratedImages(validImages.map((url, index) => ({
        url,
        style: STYLES[index],
        motif: motifText
      })))

      incrementDailyCount()
      setShowRegenerate(true)
    } catch (error) {
      console.error('生成エラー:', error)
      console.error('エラー詳細:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      const errorMessage = error.message || '不明なエラー'
      
      // より詳細なエラーメッセージを表示
      let userMessage = `画像の生成に失敗しました。\n\n`
      
      if (errorMessage.includes('CORS') || errorMessage.includes('cors')) {
        userMessage += `CORSエラーが発生しました。\n` +
          `これはブラウザのセキュリティ制限によるものです。\n\n` +
          `解決方法:\n` +
          `1. Netlify Functionsを使用してAPIリクエストをプロキシする\n` +
          `2. または、別の画像生成APIサービスを使用する\n\n`
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        userMessage += `APIキーが無効または権限が不足しています。\n\n` +
          `確認事項:\n` +
          `1. Hugging FaceのAPIキーが正しく設定されているか確認\n` +
          `2. APIキーに「Read」権限があるか確認\n` +
          `3. Netlifyで環境変数が正しく設定されているか確認\n\n`
      } else if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
        userMessage += `レート制限に達しました。\n\n` +
          `少し時間をおいてから再試行してください。\n` +
          `または、Hugging Faceの有料プランを検討してください。\n\n`
      } else if (errorMessage.includes('503') || errorMessage.includes('loading')) {
        userMessage += `モデルがロード中です。\n\n` +
          `初回リクエスト時は、モデルのロードに時間がかかります（10〜30秒）。\n` +
          `しばらく待ってから再試行してください。\n\n`
      } else if (errorMessage.includes('API') || errorMessage.includes('Failed to generate')) {
        userMessage += `実際の画像を生成するには、APIキーの設定が必要です。\n\n` +
          `無料で使える方法:\n` +
          `1. Hugging Face (https://huggingface.co/settings/tokens) でAPIキーを取得\n` +
          `2. Netlifyの環境変数に設定:\n` +
          `   - VITE_API_TYPE=huggingface\n` +
          `   - VITE_HUGGINGFACE_API_KEY=あなたのAPIキー\n\n` +
          `詳細はAPI_KEY_SETUP.mdを参照してください。\n\n`
      }
      
      userMessage += `エラー詳細: ${errorMessage}\n\n` +
        `ブラウザのコンソール（F12キー）でより詳細なエラーを確認できます。`
      
      alert(userMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (imageUrl, styleName, motifText) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `noel-atelier-${styleName}-${motifText}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRegenerate = () => {
    setGeneratedImages([])
    setShowRegenerate(false)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>NOËL ATELIER</h1>
        <div className="generation-counter">
          本日の残り生成回数: <span className="counter-number">{generationsLeft}</span> / {MAX_GENERATIONS_PER_DAY}
        </div>
      </header>

      <main className="main-content">
        {generatedImages.length === 0 && !isGenerating && (
          <div className="generation-form">
            <div className="size-selection">
              <h2>生成サイズを選択</h2>
              <div className="size-buttons">
                {SIZE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={`size-button ${selectedSize === option.value ? 'active' : ''}`}
                    onClick={() => setSelectedSize(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="motif-input-section">
              <h2>モチーフを入力</h2>
              <input
                type="text"
                className="motif-input"
                placeholder="例: クリスマスツリー、星、雪の結晶など"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                disabled={generationsLeft <= 0}
              />
            </div>

            <div className="action-buttons">
              <button
                className="generate-button"
                onClick={() => handleGenerate(false)}
                disabled={generationsLeft <= 0 || isGenerating}
              >
                生成する
              </button>
              <button
                className="ai-button"
                onClick={() => handleGenerate(true)}
                disabled={generationsLeft <= 0 || isGenerating}
              >
                AIにおまかせ
              </button>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="loading">
            <div className="spinner"></div>
            <p>オーナメントを生成中...</p>
          </div>
        )}

        {generatedImages.length > 0 && (
          <div className="results">
            <h2>生成されたオーナメント</h2>
            <div className="images-grid">
              {generatedImages.map((item, index) => {
                const size = SIZE_OPTIONS.find(s => s.value === selectedSize)
                const aspectRatio = (size.height / size.width) * 100
                return (
                  <div key={index} className="image-card">
                    <div 
                      className="image-wrapper"
                      style={{ paddingBottom: `${aspectRatio}%` }}
                    >
                      <img src={item.url} alt={item.style.name} />
                      <button
                        className="download-button"
                        onClick={() => handleDownload(item.url, item.style.id, item.motif)}
                      >
                        ダウンロード
                      </button>
                    </div>
                    <p className="style-name">{item.style.name}</p>
                  </div>
                )
              })}
            </div>

            {showRegenerate && (
              <button
                className="regenerate-button"
                onClick={handleRegenerate}
                disabled={generationsLeft <= 0}
              >
                もう一度生成する
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Produce by AYUKO MATSUMOTO</p>
      </footer>
    </div>
  )
}

export default App

