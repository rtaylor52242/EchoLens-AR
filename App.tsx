import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MOCK_MEMORIES } from './constants';
import { Memory, AppMode, ARSettings } from './types';
import { analyzeTimeShift } from './services/geminiService';
import { SciFiButton, SciFiSlider } from './components/UIComponents';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  // -- State --
  const [mode, setMode] = useState<AppMode>(AppMode.SCANNING);
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);
  const [arSettings, setArSettings] = useState<ARSettings>({
    opacity: 0.5,
    scale: 1,
    rotation: 0,
    xOffset: 0,
    yOffset: 0
  });
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [locationDebug, setLocationDebug] = useState<{lat: number, lng: number} | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // -- Refs --
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // -- Camera Initialization --
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 } 
          },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("Camera access is required for AR features.");
      }
    };

    startCamera();
    
    // Mock Geolocation tracking
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLocationDebug({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log("Geo error", err),
      { enableHighAccuracy: true }
    );

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      navigator.geolocation.clearWatch(watchId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Actions --

  const selectMemory = (mem: Memory) => {
    setActiveMemory(mem);
    setMode(AppMode.AR_VIEW);
    setArSettings({
      opacity: 0.5,
      scale: 1,
      rotation: 0,
      xOffset: 0,
      yOffset: 0
    });
    setAiAnalysis("");
  };

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !activeMemory) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // 1. Draw Video Feed
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // 2. Draw Overlay
      // We need to load the image into an HTMLImageElement to draw it
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = activeMemory.url;
      
      img.onload = () => {
        ctx.save();
        
        // Apply transformations based on AR Settings
        const centerX = canvas.width / 2 + arSettings.xOffset * 2; // Scale offset for canvas
        const centerY = canvas.height / 2 + arSettings.yOffset * 2;
        
        ctx.translate(centerX, centerY);
        ctx.rotate((arSettings.rotation * Math.PI) / 180);
        ctx.scale(arSettings.scale, arSettings.scale);
        ctx.globalAlpha = arSettings.opacity;
        
        // Draw centered
        // Maintain aspect ratio relative to canvas
        const drawWidth = canvas.width * 0.8; // Default 80% width
        const ratio = img.naturalHeight / img.naturalWidth;
        const drawHeight = drawWidth * ratio;
        
        ctx.drawImage(img, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
        
        ctx.restore();
        
        // 3. Save result
        const finalImage = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(finalImage);
        setMode(AppMode.CAPTURED);
      };
    }
  }, [activeMemory, arSettings]);

  const handleAnalyze = async () => {
    if (!videoRef.current || !activeMemory) return;
    
    setIsAnalyzing(true);
    
    // Capture current frame for AI
    const canvas = document.createElement('canvas');
    canvas.width = 640; // Lower res for API speed
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      
      const result = await analyzeTimeShift(base64, activeMemory.url);
      setAiAnalysis(result);
    }
    setIsAnalyzing(false);
  };

  const downloadCapture = () => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `echolens-${Date.now()}.jpg`;
      link.click();
    }
  };

  // -- Render Helpers --

  const renderScanningOverlay = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
      <div className="w-64 h-64 border-2 border-cyan-400/50 rounded-full animate-pulse flex items-center justify-center relative">
        <div className="w-60 h-60 border border-cyan-400/30 rounded-full animate-spin" style={{ animationDuration: '10s' }}></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 px-2 text-cyan-400 text-xs font-mono">
          SCANNING SECTOR
        </div>
      </div>
      
      <div className="mt-8 w-full max-w-md px-4 pointer-events-auto space-y-4">
        <h2 className="text-center text-cyan-100 font-bold tracking-widest mb-4 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
          TEMPORAL RIFTS DETECTED ({MOCK_MEMORIES.length})
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {MOCK_MEMORIES.map((mem) => (
            <div 
              key={mem.id}
              onClick={() => selectMemory(mem)}
              className="flex-shrink-0 snap-center w-40 bg-slate-900/80 border border-cyan-900 rounded-lg p-2 cursor-pointer hover:border-cyan-400 transition-all"
            >
              <img src={mem.thumbnail} alt="Memory" className="w-full h-24 object-cover rounded mb-2 opacity-80 hover:opacity-100" />
              <div className="text-xs text-cyan-300 font-mono truncate">{mem.timestamp.split('T')[0]}</div>
              <div className="text-[10px] text-slate-400 truncate">{mem.location.placeName}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderARHUD = () => {
    if (!activeMemory) return null;
    
    return (
      <>
        {/* Top Bar Info */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
           <div>
             <h3 className="text-cyan-400 font-bold text-lg tracking-wider">ECHOLENS <span className="text-xs align-top opacity-70">v1.0</span></h3>
             <p className="text-xs font-mono text-cyan-200/70">
               LOC: {activeMemory.location.lat.toFixed(4)}, {activeMemory.location.lng.toFixed(4)}
             </p>
             <p className="text-xs font-mono text-amber-400">
               TEMPORAL DATE: {new Date(activeMemory.timestamp).toLocaleDateString()}
             </p>
           </div>
           <SciFiButton 
             variant="secondary" 
             onClick={() => setMode(AppMode.SCANNING)}
             className="!py-1 !px-3 text-xs"
           >
             EXIT AR
           </SciFiButton>
        </div>

        {/* AI Analysis Box */}
        {aiAnalysis && (
          <div className="absolute top-24 left-4 right-4 bg-black/60 border-l-2 border-cyan-400 p-4 z-10 backdrop-blur-md animate-fade-in">
            <h4 className="text-cyan-400 text-xs font-bold uppercase mb-1">System Analysis</h4>
            <p className="text-sm text-slate-200 leading-tight font-mono">{aiAnalysis}</p>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-30">
          
          {/* Sliders Container */}
          <div className="flex flex-wrap gap-2 justify-center mb-6 max-w-2xl mx-auto">
            <SciFiSlider 
              label="OPACITY" 
              min={0} max={1} step={0.05} 
              value={arSettings.opacity} 
              onChange={(v) => setArSettings(p => ({...p, opacity: v}))} 
            />
            <SciFiSlider 
              label="SCALE" 
              min={0.5} max={3} step={0.1} 
              value={arSettings.scale} 
              onChange={(v) => setArSettings(p => ({...p, scale: v}))} 
            />
            <SciFiSlider 
              label="X-AXIS" 
              min={-200} max={200} step={5} 
              value={arSettings.xOffset} 
              onChange={(v) => setArSettings(p => ({...p, xOffset: v}))} 
            />
            <SciFiSlider 
              label="Y-AXIS" 
              min={-200} max={200} step={5} 
              value={arSettings.yOffset} 
              onChange={(v) => setArSettings(p => ({...p, yOffset: v}))} 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center items-center pb-4">
            <SciFiButton 
              onClick={handleAnalyze} 
              variant="secondary"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "ANALYZING..." : "AI ANALYZE"}
            </SciFiButton>
            
            <button 
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center relative group active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 bg-cyan-400 rounded-full group-hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all"></div>
            </button>
            
            <div className="w-24"></div> {/* Spacer for balance */}
          </div>
        </div>
      </>
    );
  };

  const renderCapturedView = () => (
    <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4 tracking-widest">MEMORY CAPTURED</h2>
      {capturedImage && (
        <div className="border-2 border-cyan-500/50 rounded-lg p-1 mb-6 shadow-[0_0_30px_rgba(34,211,238,0.2)] bg-black">
          <img src={capturedImage} alt="Captured" className="max-h-[60vh] max-w-full" />
        </div>
      )}
      <div className="flex gap-4">
        <SciFiButton onClick={() => setMode(AppMode.AR_VIEW)} variant="secondary">
          DISCARD
        </SciFiButton>
        <SciFiButton onClick={downloadCapture} variant="primary">
          SAVE TO DEVICE
        </SciFiButton>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Base Video Layer */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-90"
      />
      
      {/* Scan lines effect */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      <div className="absolute inset-0 pointer-events-none z-0 scan-line opacity-20"></div>

      {/* AR Overlay Layer (The Ghost Image) */}
      {mode === AppMode.AR_VIEW && activeMemory && (
        <div 
          className="absolute inset-0 z-10 overflow-hidden pointer-events-none flex items-center justify-center"
        >
          <div
             style={{
               opacity: arSettings.opacity,
               transform: `
                 translate(${arSettings.xOffset}px, ${arSettings.yOffset}px) 
                 scale(${arSettings.scale}) 
                 rotate(${arSettings.rotation}deg)
               `,
               transition: 'transform 0.1s ease-out, opacity 0.2s'
             }}
             className="relative"
          >
            <img 
              src={activeMemory.url} 
              alt="Ghost" 
              className="max-w-[80vw] max-h-[60vh] shadow-2xl mix-blend-hard-light filter sepia-[0.3] contrast-125"
              style={{ boxShadow: '0 0 50px rgba(6,182,212,0.3)' }}
            />
            {/* Glitch effect border */}
            <div className="absolute inset-0 border border-cyan-400/30 mix-blend-overlay"></div>
          </div>
        </div>
      )}

      {/* Interface Layers */}
      {mode === AppMode.SCANNING && renderScanningOverlay()}
      {mode === AppMode.AR_VIEW && renderARHUD()}
      {mode === AppMode.CAPTURED && renderCapturedView()}
      
      {/* Global Location Debug (Bottom Left) */}
      <div className="absolute bottom-2 left-2 z-10 text-[10px] font-mono text-cyan-900/50">
        GPS: {locationDebug?.lat.toFixed(5) || '---'}, {locationDebug?.lng.toFixed(5) || '---'}
      </div>
    </div>
  );
};

export default App;
