import { useState, useRef, useCallback, useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Upload, Download, RotateCw, ZoomIn, ZoomOut, Moon, Sun, X, Move } from 'lucide-react'
import './App.css'

interface ImageState {
  src: string
  x: number
  y: number
  scale: number
  rotation: number
}

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  startImageX: number
  startImageY: number
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [profileImage, setProfileImage] = useState<ImageState | null>(null)
  const [frameImage, setFrameImage] = useState<string | null>('/frames/DP.png')
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startImageX: 0,
    startImageY: 0
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Frame is fixed; no upload input needed
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const frameImgElementRef = useRef<HTMLImageElement>(null)
  const profileImgElementRef = useRef<HTMLImageElement>(null)
  const controlsRailRef = useRef<HTMLDivElement>(null)
  const [controlsStyle, setControlsStyle] = useState<React.CSSProperties>({})
  const [controlsUserPos, setControlsUserPos] = useState<{ top: number; left: number } | null>(null)
  const [isDraggingControls, setIsDraggingControls] = useState(false)
  const controlsDragStartRef = useRef<{ startX: number; startY: number; startTop: number; startLeft: number }>({ startX: 0, startY: 0, startTop: 0, startLeft: 0 })

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'frame') => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      
      if (type === 'profile') {
        setProfileImage({
          src,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0
        })
        toast.success('Profile image uploaded successfully!')
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const getCanvasPosition = useCallback((clientX: number, clientY: number) => {
    if (!canvasContainerRef.current) return { x: 0, y: 0 }
    
    const rect = canvasContainerRef.current.getBoundingClientRect()
    return {
      x: clientX - rect.left - rect.width / 2,
      y: clientY - rect.top - rect.height / 2
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!profileImage) return
    e.preventDefault()
    
    const pos = getCanvasPosition(e.clientX, e.clientY)
    setDragState({
      isDragging: true,
      startX: pos.x,
      startY: pos.y,
      startImageX: profileImage.x,
      startImageY: profileImage.y
    })
  }, [profileImage, getCanvasPosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !profileImage) return
    e.preventDefault()
    
    const pos = getCanvasPosition(e.clientX, e.clientY)
    const deltaX = pos.x - dragState.startX
    const deltaY = pos.y - dragState.startY
    
    setProfileImage(prev => prev ? {
      ...prev,
      x: dragState.startImageX + deltaX,
      y: dragState.startImageY + deltaY
    } : null)
  }, [dragState, profileImage, getCanvasPosition])

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }))
  }, [])

  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!profileImage) return
    e.preventDefault()
    
    const touch = e.touches[0]
    const pos = getCanvasPosition(touch.clientX, touch.clientY)
    setDragState({
      isDragging: true,
      startX: pos.x,
      startY: pos.y,
      startImageX: profileImage.x,
      startImageY: profileImage.y
    })
  }, [profileImage, getCanvasPosition])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragState.isDragging || !profileImage) return
    e.preventDefault()
    
    const touch = e.touches[0]
    const pos = getCanvasPosition(touch.clientX, touch.clientY)
    const deltaX = pos.x - dragState.startX
    const deltaY = pos.y - dragState.startY
    
    setProfileImage(prev => prev ? {
      ...prev,
      x: dragState.startImageX + deltaX,
      y: dragState.startImageY + deltaY
    } : null)
  }, [dragState, profileImage, getCanvasPosition])

  const handleTouchEnd = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }))
  }, [])

  const handleRotate = useCallback(() => {
    if (!profileImage) return
    setProfileImage(prev => prev ? {
      ...prev,
      rotation: prev.rotation + 90
    } : null)
    toast.success('Image rotated!')
  }, [profileImage])

  const handlePreciseRotate = useCallback((rotation: number) => {
    if (!profileImage) return
    setProfileImage(prev => prev ? {
      ...prev,
      rotation: rotation
    } : null)
  }, [profileImage])

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (!profileImage) return
    const factor = direction === 'in' ? 1.1 : 0.9
    setProfileImage(prev => prev ? {
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * factor))
    } : null)
    toast.success(`Image ${direction === 'in' ? 'zoomed in' : 'zoomed out'}!`)
  }, [profileImage])

  const handleDownload = useCallback(() => {
    if (!canvasRef.current || !profileImage || !frameImage || !canvasContainerRef.current) {
      toast.error('Please upload both profile image and frame first!')
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use the actual displayed frame size for precise mapping
    const displayedFrameWidth = frameImgElementRef.current?.offsetWidth || canvasContainerRef.current.clientWidth
    const displayedFrameHeight = frameImgElementRef.current?.offsetHeight || canvasContainerRef.current.clientHeight

    // Create images
    const profileImg = new Image()
    const frameImg = new Image()

    profileImg.onload = () => {
      frameImg.onload = () => {
        // Set canvas to frame's natural size for highest quality
        canvas.width = frameImg.width
        canvas.height = frameImg.height
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Calculate mapping ratios from displayed preview to natural canvas
        const scaleX = frameImg.width / displayedFrameWidth
        const scaleY = frameImg.height / displayedFrameHeight

        // Draw profile image with exact coordinate mapping
        ctx.save()
        
        // Map preview coordinates (relative to frame center) to canvas coordinates
        const actualX = (displayedFrameWidth / 2 + profileImage.x) * scaleX
        const actualY = (displayedFrameHeight / 2 + profileImage.y) * scaleY

        // Determine the profile image's displayed base size in the preview (before transforms)
        const baseDisplayedProfileWidth = profileImgElementRef.current?.offsetWidth || profileImg.width
        const baseDisplayedProfileHeight = profileImgElementRef.current?.offsetHeight || profileImg.height

        // Compute the destination size on the canvas to match the preview exactly
        const destWidth = baseDisplayedProfileWidth * profileImage.scale * Math.min(scaleX, scaleY)
        const destHeight = baseDisplayedProfileHeight * profileImage.scale * Math.min(scaleX, scaleY)

        ctx.translate(actualX, actualY)
        ctx.rotate((profileImage.rotation * Math.PI) / 180)
        // Draw centered with explicit destination size
        ctx.drawImage(profileImg, -destWidth / 2, -destHeight / 2, destWidth, destHeight)
        ctx.restore()

        // Draw frame
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height)

        // Download
        const link = document.createElement('a')
        link.download = 'twibbon-image.png'
        link.href = canvas.toDataURL('image/png', 1.0)
        link.click()

        toast.success('Image downloaded successfully!')
      }
      frameImg.src = frameImage
    }
    profileImg.src = profileImage.src
  }, [profileImage, frameImage])

  // Dynamically place the controls rail so it never overlaps the frame image
  const updateControlsPosition = useCallback(() => {
    if (!canvasContainerRef.current || !frameImgElementRef.current) return
    const containerRect = canvasContainerRef.current.getBoundingClientRect()
    const frameRect = frameImgElementRef.current.getBoundingClientRect()

    const desiredWidth = controlsRailRef.current?.offsetWidth || 220
    const desiredHeight = controlsRailRef.current?.offsetHeight || 140
    const margin = 12

    const spaceLeft = frameRect.left - containerRect.left - margin
    const spaceRight = containerRect.right - frameRect.right - margin
    const spaceTop = frameRect.top - containerRect.top - margin

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

    // If user dragged, respect their position but clamp it within container
    if (controlsUserPos) {
      const width = controlsRailRef.current?.offsetWidth || desiredWidth
      const height = controlsRailRef.current?.offsetHeight || desiredHeight
      const clampedLeft = clamp(controlsUserPos.left, margin, containerRect.width - width - margin)
      const clampedTop = clamp(controlsUserPos.top, margin, containerRect.height - height - margin)
      setControlsStyle({ position: 'absolute', top: clampedTop, left: clampedLeft })
      return
    }

    // Try left (preferred), then right, then top, then bottom
    if (spaceLeft >= desiredWidth) {
      const top = clamp(
        frameRect.top - containerRect.top + frameRect.height / 2 - desiredHeight / 2,
        margin,
        containerRect.height - desiredHeight - margin
      )
      setControlsStyle({ position: 'absolute', top, left: margin })
      return
    }
    if (spaceRight >= desiredWidth) {
      const top = clamp(
        frameRect.top - containerRect.top + frameRect.height / 2 - desiredHeight / 2,
        margin,
        containerRect.height - desiredHeight - margin
      )
      const left = frameRect.right - containerRect.left + margin
      setControlsStyle({ position: 'absolute', top, left })
      return
    }
    if (spaceTop >= desiredHeight) {
      const left = clamp(
        frameRect.left - containerRect.left + frameRect.width / 2 - desiredWidth / 2,
        margin,
        containerRect.width - desiredWidth - margin
      )
      setControlsStyle({ position: 'absolute', top: margin, left })
      return
    }
    // Default to bottom
    const left = clamp(
      frameRect.left - containerRect.left + frameRect.width / 2 - desiredWidth / 2,
      margin,
      containerRect.width - desiredWidth - margin
    )
    const top = frameRect.bottom - containerRect.top + margin
    setControlsStyle({ position: 'absolute', top, left })
  }, [controlsUserPos])

  useEffect(() => {
    updateControlsPosition()
    const onResize = () => updateControlsPosition()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [updateControlsPosition])

  // Recompute position when profile transforms change or frame loads
  useEffect(() => {
    updateControlsPosition()
  }, [profileImage?.x, profileImage?.y, profileImage?.scale, profileImage?.rotation, updateControlsPosition])

  // Drag controls rail
  const beginControlsDrag = useCallback((clientX: number, clientY: number) => {
    if (!controlsRailRef.current || !canvasContainerRef.current) return
    const containerRect = canvasContainerRef.current.getBoundingClientRect()
    const railRect = controlsRailRef.current.getBoundingClientRect()
    controlsDragStartRef.current = {
      startX: clientX,
      startY: clientY,
      startTop: railRect.top - containerRect.top,
      startLeft: railRect.left - containerRect.left
    }
    setIsDraggingControls(true)
  }, [])

  const onControlsDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingControls || !canvasContainerRef.current || !controlsRailRef.current) return
    const containerRect = canvasContainerRef.current.getBoundingClientRect()
    const width = controlsRailRef.current.offsetWidth
    const height = controlsRailRef.current.offsetHeight
    const margin = 8
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
    const deltaX = clientX - controlsDragStartRef.current.startX
    const deltaY = clientY - controlsDragStartRef.current.startY
    const nextLeft = clamp(controlsDragStartRef.current.startLeft + deltaX, margin, containerRect.width - width - margin)
    const nextTop = clamp(controlsDragStartRef.current.startTop + deltaY, margin, containerRect.height - height - margin)
    setControlsStyle({ position: 'absolute', top: nextTop, left: nextLeft })
  }, [isDraggingControls])

  const endControlsDrag = useCallback(() => {
    if (!isDraggingControls) return
    setIsDraggingControls(false)
    // Persist the last style as user preference
    if (typeof controlsStyle.top === 'number' && typeof controlsStyle.left === 'number') {
      setControlsUserPos({ top: controlsStyle.top, left: controlsStyle.left })
    }
  }, [isDraggingControls, controlsStyle])

  // Global listeners for control drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => onControlsDragMove(e.clientX, e.clientY)
    const handleMouseUp = () => endControlsDrag()
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) onControlsDragMove(e.touches[0].clientX, e.touches[0].clientY)
    }
    const handleTouchEnd = () => endControlsDrag()
    if (isDraggingControls) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDraggingControls, onControlsDragMove, endControlsDrag])

  const clearAll = useCallback(() => {
    setProfileImage(null)
    setFrameImage('/frames/sample-frame.svg')
    if (fileInputRef.current) fileInputRef.current.value = ''
    toast.success('All images cleared!')
  }, [])

  // Prevent context menu on canvas
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  // Prevent touch events on rotation slider
  const handleSliderTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }, [])

  const handleSliderTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }, [])

  const handleSliderTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }, [])

  // Prevent mouse events on rotation slider from interfering with image dragging
  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const handleSliderMouseMove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const handleSliderMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  // Add global mouse/touch event listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDragState(prev => ({ ...prev, isDragging: false }))
    }

    const handleGlobalTouchEnd = () => {
      setDragState(prev => ({ ...prev, isDragging: false }))
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('touchend', handleGlobalTouchEnd)

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [])

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#f9fafb' : '#111827',
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
          }
        }}
      />
      
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <img className="site-logo" src="/icons/CCISLOGO.png" alt="Site logo" />
            <h1 className="title title-badge">
              <span className="gradient-text">Jed</span>Bonize
            </h1>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <main className="main">
        <div className="workspace">
          {/* Controls Panel - Now above the canvas */}
          <div className="controls-panel">
            <div className="control-section">
              <h3>Upload Images</h3>
              <div className="upload-buttons">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-btn"
                >
                  <Upload size={16} />
                  Upload Profile
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'profile')}
                style={{ display: 'none' }}
              />
            </div>

            <div className="control-section">
              <h3>Actions</h3>
              <div className="action-buttons">
                <button
                  onClick={handleDownload}
                  className="download-btn"
                  disabled={!profileImage || !frameImage}
                >
                  <Download size={16} />
                  Download HD
                </button>
                <button
                  onClick={clearAll}
                  className="clear-btn"
                >
                  <X size={16} />
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="canvas-container">
            <div 
              ref={canvasContainerRef}
              className="canvas-area"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onContextMenu={handleContextMenu}
            >
              {/* Profile Image - Behind the frame */}
              {profileImage && (
                <div className="profile-image-container">
                  <img
                    src={profileImage.src}
                    alt="Profile"
                    className="profile-image"
                    ref={profileImgElementRef}
                    style={{
                      transform: `translate(${profileImage.x}px, ${profileImage.y}px) scale(${profileImage.scale}) rotate(${profileImage.rotation}deg)`,
                      cursor: dragState.isDragging ? 'grabbing' : 'grab',
                      touchAction: 'none'
                    }}
                    draggable={false}
                  />
                </div>
              )}
              
              {/* Frame Image - Above the profile but below controls */}
              {frameImage && (
                <img 
                  src={frameImage} 
                  alt="Frame" 
                  className="frame-image"
                  ref={frameImgElementRef}
                  draggable={false}
                />
              )}
              
              {/* Dynamic controls rail that repositions to avoid frame overlap */}
              {profileImage && (
                <div
                  className="left-rail"
                  ref={controlsRailRef}
                  style={controlsStyle}
                >
                  <div
                    className="controls-drag-handle"
                    title="Drag controls"
                    onMouseDown={(e) => beginControlsDrag(e.clientX, e.clientY)}
                    onTouchStart={(e) => {
                      const t = e.touches[0]
                      if (t) beginControlsDrag(t.clientX, t.clientY)
                    }}
                  >
                    <Move size={14} />
                  </div>
                  <div className="floating-controls">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRotate()
                      }}
                      className="floating-control-btn rotate-btn"
                      title="Rotate 90°"
                    >
                      <RotateCw size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleZoom('in')
                      }}
                      className="floating-control-btn zoom-in-btn"
                      title="Zoom In"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleZoom('out')
                      }}
                      className="floating-control-btn zoom-out-btn"
                      title="Zoom Out"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <div className="scale-display">
                      {(profileImage.scale * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div 
                    className="rotation-slider-container"
                    onTouchStart={handleSliderTouchStart}
                    onTouchMove={handleSliderTouchMove}
                    onTouchEnd={handleSliderTouchEnd}
                    onMouseDown={handleSliderMouseDown}
                    onMouseMove={handleSliderMouseMove}
                    onMouseUp={handleSliderMouseUp}
                  >
                    <label className="rotation-label">Rotation: {profileImage.rotation.toFixed(0)}°</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={profileImage.rotation}
                      onChange={(e) => handlePreciseRotate(parseInt(e.target.value))}
                      className="rotation-slider"
                      title="Precise rotation control"
                      onTouchStart={handleSliderTouchStart}
                      onTouchMove={handleSliderTouchMove}
                      onTouchEnd={handleSliderTouchEnd}
                      onMouseDown={handleSliderMouseDown}
                      onMouseMove={handleSliderMouseMove}
                      onMouseUp={handleSliderMouseUp}
                    />
                  </div>
                </div>
              )}
              
              {/* Drag indicator */}
              {profileImage && (
                <div className="drag-indicator">
                  <Move size={20} />
                  <span>Drag to move</span>
                </div>
              )}
              
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </div>
        </div>
        <footer className="site-footer">
          <a
            className="profile-card breathing-glow"
            href="https://github.com/MeviDiRaizel"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Jed (MeviDiRaizel) on GitHub"
          >
            <img className="profile-avatar" src="/icons/mevidiraizel.jpg" alt="Jed avatar" />
            <div className="profile-meta">
              <div className="profile-name">Jed (MeviDiRaizel)</div>
              <div className="profile-url">github.com/MeviDiRaizel</div>
            </div>
          </a>
        </footer>
      </main>
    </div>
  )
}

export default App
