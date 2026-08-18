import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Globe, Smartphone } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import './ScanQR.css';

const ScanQR = () => {
  const cardRef = useRef();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      
      const downloadLink = document.createElement("a");
      downloadLink.download = "Orientation-QR-Poster.png";
      downloadLink.href = dataUrl;
      downloadLink.click();
    } catch (err) {
      console.error("Failed to generate image", err);
    }
  };

  const qrUrl = import.meta.env.VITE_ORIENTATION_URL || "https://oipr.adityauniversity.in/orientation";

  return (
    <div className="scan-qr-container">
      <div className="download-controls">
        <button className="download-btn" onClick={handleDownload}>
          <Download size={20} />
          <span>Download Poster</span>
        </button>
      </div>

      <div className="poster-scale-wrapper">
        <div ref={cardRef} className="qr-poster">
          {/* Top Left Swooshes */}
          <svg className="poster-bg-top" viewBox="0 0 650 400" preserveAspectRatio="none">
            {/* Orange Swoosh */}
            <path d="M120,130 C130,-10 380,-10 380,-10 C380,-10 120,-30 80,100 Z" fill="#ff5e00" />
            {/* Dark Blue Swoosh */}
            <path d="M100,160 C120,0 350,-10 350,-10 C350,-10 90,0 60,150 Z" fill="#06113c" />
            
            {/* Accent triangles left */}
            <polygon points="65,210 75,200 85,210" fill="#06113c" />
            <polygon points="60,225 70,215 80,225" fill="#ff5e00" />
            <polygon points="45,210 55,200 65,210" fill="#06113c" />
          </svg>

          {/* Bottom Right Wave */}
          <svg className="poster-bg-bottom" viewBox="0 0 650 350" preserveAspectRatio="none">
            {/* Orange Layer */}
            <path d="M-50,350 Q250,150 700,200 L700,350 Z" fill="#ff5e00" />
            {/* Dark Blue Layer */}
            <path d="M-50,350 Q300,180 700,220 L700,350 Z" fill="#06113c" />
          </svg>

          <div className="poster-content">
            <div className="poster-header">
              {/* Graduation Cap SVG */}
              <svg className="grad-cap-overlay" viewBox="0 0 100 100">
                <path d="M50,15 L95,35 L50,55 L5,35 Z" fill="#06113c" />
                <path d="M25,43 L25,70 Q50,85 75,70 L75,43 L50,55 Z" fill="#06113c" />
                {/* Tassel */}
                <path d="M50,35 L85,55" stroke="#ff5e00" strokeWidth="3" />
                <circle cx="85" cy="60" r="4" fill="#ff5e00" />
                <rect x="83" y="60" width="4" height="20" fill="#ff5e00" />
              </svg>

              <h1 className="title-orientation" data-text="Orientation">Orientation</h1>
              <h1 className="title-qr-code">QR CODE</h1>
              <div className="qr-underline"></div>

              {/* Accent triangles right */}
              <svg style={{ position: 'absolute', right: '30px', top: '150px', width: '40px', height: '40px' }}>
                <polygon points="20,10 30,0 40,10" fill="#06113c" transform="rotate(45)" />
                <polygon points="10,25 20,15 30,25" fill="#ff5e00" transform="rotate(45)" />
              </svg>

              <div className="subtitle-container">
                <div className="subtitle-line">
                  <div className="line-main"></div>
                  <div className="line-accent"></div>
                </div>
                <p className="poster-subtitle">
                  Scan this code to easily access the<br />Orientation Enrollment form.
                </p>
                <div className="subtitle-line">
                  <div className="line-accent"></div>
                  <div className="line-main"></div>
                </div>
              </div>
            </div>

            {/* Central Polygons (The blue and orange backdrop behind QR) */}
            <div className="orange-polygon-bg"></div>
            <div className="blue-polygon-bg"></div>

            <div className="qr-frame-outer">
              {/* Top-Right Orange Slit Accents */}
              <svg style={{ position: 'absolute', top: '-2px', right: '-2px', width: '40px', height: '40px', zIndex: 12 }}>
                <path d="M20,0 L40,20 M30,0 L40,10 M10,0 L40,30" stroke="#ff5e00" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
              {/* Bottom-Left Orange Slit Accents */}
              <svg style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '40px', height: '40px', zIndex: 12 }}>
                <path d="M0,20 L20,40 M0,30 L10,40 M0,10 L30,40" stroke="#ff5e00" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>

              <div className="qr-frame-inner">
                <QRCodeSVG 
                  value={qrUrl} 
                  size={240}
                  level={"H"}
                  includeMargin={false}
                  bgColor={"#ffffff"}
                  fgColor={"#06113c"}
                />
              </div>
              <div className="scan-me-badge">
                <div className="badge-icon">
                  <Smartphone size={18} color="white" />
                </div>
                <span>SCAN ME!</span>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M4,20 L12,4 M10,20 L18,4 M16,20 L24,4" stroke="#ff5e00" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Footer URL Pill */}
          <div className="url-pill-container">
            <div className="url-pill">
              <Globe className="url-icon" size={24} />
              <span>{qrUrl}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;
