import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import DOMPurify from 'dompurify'
// ── SVG Icon Components ────────────────────────────────────────────────────────
const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const IconFlip = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)

const IconRefresh = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-3.1"/>
  </svg>
)

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const IconUpload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

// ── Helpers ────────────────────────────────────────────────────────────────────
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
})

// ── App ────────────────────────────────────────────────────────────────────────
function App() {
  const [lensActive, setLensActive] = useState(false)

  // Normal mode
  const [inputText, setInputText]     = useState('')
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Lens mode
  const [facingMode, setFacingMode]   = useState('environment')
  const [lensCapture, setLensCapture] = useState(null)
  const [cameraError, setCameraError] = useState('')
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)

  // Shared
  const [analysisMode, setAnalysisMode] = useState('Normal')
  const [language, setLanguage]         = useState('Hindi')
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState(null)
  const [error, setError]               = useState('')

  const languages = [
    'Hindi','Bengali','Telugu','Marathi','Tamil',
    'Urdu','Gujarati','Kannada','Odia','Malayalam','English'
  ]

  // ── Camera ──────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing) => {
    setCameraError('')
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
    } catch {
      setCameraError('Camera access denied or unavailable. Please allow camera permission in your browser.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
  }, [])

  useEffect(() => {
    if (lensActive) { setLensCapture(null); setResult(null); setError(''); startCamera(facingMode) }
    else stopCamera()
    return stopCamera
  }, [lensActive])

  useEffect(() => {
    if (lensActive && !lensCapture) startCamera(facingMode)
  }, [facingMode])

  const capturePhoto = () => {
    const v = videoRef.current, c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    setLensCapture(c.toDataURL('image/jpeg', 0.92))
    stopCamera()
  }

  const retakePhoto = () => { setLensCapture(null); setResult(null); setError(''); startCamera(facingMode) }

  // ── Normal mode handlers ────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)) }
  }
  const handlePaste = (e) => {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile()
        setImageFile(blob); setImagePreview(URL.createObjectURL(blob))
        e.preventDefault(); return
      }
    }
  }
  const removeImage = () => { setImageFile(null); setImagePreview(null) }

  // ── Analyze ─────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    let base64Image = null
    if (lensActive) {
      if (!lensCapture) { setError('Please capture a photo first.'); return }
      base64Image = lensCapture
    } else {
      if (!inputText.trim() && !imageFile) { setError('Please enter an ingredient list, product name, or upload an image.'); return }
      if (imageFile) base64Image = await fileToBase64(imageFile)
    }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('https://know-what-your-eating.onrender.com/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lensActive ? '' : inputText, language, mode: analysisMode, image: base64Image })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Toggle lens ─────────────────────────────────────────────────────────────
  const toggleLens = () => { setLensActive(prev => !prev); setResult(null); setError('') }

  return (
    <div className="app-container">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-top">
          <div className="brand">
            <div className="brand-icon"><IconShield /></div>
            <span className="brand-name">FoodLabel AI</span>
          </div>
          <button className={`lens-toggle ${lensActive ? 'lens-on' : ''}`} onClick={toggleLens}>
            <IconCamera />
            <span>{lensActive ? 'Close Lens' : 'Lens Mode'}</span>
          </button>
        </div>
        <p className="disclaimer">
          <IconShield /> AI-generated · informational only · not medical advice
        </p>
      </header>

      <main className="main-content">

        {/* ── LENS MODE ──────────────────────────────────────────────────────── */}
        {lensActive && (
          <div className="lens-section">
            {cameraError
              ? <div className="error-message">{cameraError}</div>
              : !lensCapture
                ? (
                  <div className="viewfinder-wrapper">
                    <video ref={videoRef} className="viewfinder" autoPlay playsInline muted />
                    <div className="vf-corners">
                      <span className="vf-c tl"/><span className="vf-c tr"/>
                      <span className="vf-c bl"/><span className="vf-c br"/>
                    </div>
                    <p className="vf-hint">Align the food label within the frame</p>
                    <div className="lens-controls">
                      <button className="icon-btn flip-btn" onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}>
                        <IconFlip />
                        <span>{facingMode === 'environment' ? 'Front' : 'Back'}</span>
                      </button>
                      <button className="shutter-btn" onClick={capturePhoto} aria-label="Capture photo" />
                      <div style={{ width: 80 }} />
                    </div>
                  </div>
                )
                : (
                  <div className="captured-section">
                    <div className="captured-badge">Photo captured</div>
                    <img src={lensCapture} alt="Captured label" className="captured-img" />
                    <button className="icon-btn retake-btn" onClick={retakePhoto}>
                      <IconRefresh /><span>Retake</span>
                    </button>
                  </div>
                )
            }
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

        {/* ── NORMAL MODE ────────────────────────────────────────────────────── */}
        {!lensActive && (
          <div className="normal-section">
            <div className="input-group">
              <label htmlFor="ingredients">Ingredients or product name</label>
              <textarea
                id="ingredients"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onPaste={handlePaste}
                placeholder="Type ingredients, paste a product name, or paste an image directly here…"
                rows={4}
              />
            </div>

            <div className="upload-zone">
              <label htmlFor="img-upload" className="upload-label">
                <IconUpload />
                <span>Upload a label photo</span>
                <span className="upload-sub">or paste with Ctrl+V in the field above</span>
              </label>
              <input type="file" id="img-upload" accept="image/*" onChange={handleImageChange} hidden />
              {imagePreview && (
                <div className="img-preview-wrap">
                  <img src={imagePreview} alt="Preview" className="img-preview" />
                  <button className="remove-img-btn" onClick={removeImage} aria-label="Remove image">
                    <IconX />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS ───────────────────────────────────────────────────────── */}
        <div className="settings-card">
          <div className="setting-row">
            <label htmlFor="analysisMode">Mode</label>
            <div className="select-wrap">
              <select id="analysisMode" value={analysisMode} onChange={e => setAnalysisMode(e.target.value)}>
                <option value="Normal">Normal – Simple summary &amp; health rating</option>
                <option value="Expert">Expert – Technical &amp; scientific breakdown</option>
              </select>
              <IconChevronDown />
            </div>
          </div>
          <div className="divider" />
          <div className="setting-row">
            <label htmlFor="language">Language</label>
            <div className="select-wrap">
              <select id="language" value={language} onChange={e => setLanguage(e.target.value)}>
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <IconChevronDown />
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTON ──────────────────────────────────────────────────── */}
        <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
          {loading
            ? <><span className="spinner" /> Analyzing…</>
            : <><IconSearch /><span>Analyze</span></>
          }
        </button>

        {/* ── ERROR ──────────────────────────────────────────────────────────── */}
        {error && <div className="error-message">{error}</div>}

        {/* ── RESULT ─────────────────────────────────────────────────────────── */}
        {result && (
          <div
          className="result-body"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(String(result.translated_analysis || ''), {
              ALLOWED_TAGS: ['div','span','p','h3','h4','ul','ol','li','table','thead',
                            'tbody','tr','td','th','b','strong','small','hr','br'],
              ALLOWED_ATTR: ['style'],
    })
  }}
/>
        )}

      </main>
    </div>
  )
}

export default App
