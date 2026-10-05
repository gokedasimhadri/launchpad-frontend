import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Globe, Smartphone, Copy, Check, CreditCard, ExternalLink } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import './ScanQR.css';

const ScanQR = () => {
  const cardRef = useRef();
  const [copied, setCopied] = useState(false);

  // Direct Student Payment Link without login
  const defaultPayUrl = `${window.location.origin}/student-pay`;
  const qrUrl = import.meta.env.VITE_ORIENTATION_PAY_URL || defaultPayUrl;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1.0,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      
      const downloadLink = document.createElement("a");
      downloadLink.download = "Student-Razorpay-QR-Poster.png";
      downloadLink.href = dataUrl;
      downloadLink.click();
    } catch (err) {
      console.error("Failed to generate image", err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="scan-qr-container">
      <div className="download-controls">
        <button className="download-btn" onClick={handleDownload}>
          <Download size={20} />
          <span>Download Poster</span>
        </button>

        <button className="download-btn copy-link-btn" onClick={handleCopyLink}>
          {copied ? <Check size={20} color="#22c55e" /> : <Copy size={20} />}
          <span>{copied ? 'Link Copied!' : 'Copy Direct Student Link'}</span>
        </button>

        <a 
          href={qrUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="download-btn open-link-btn"
        >
          <ExternalLink size={20} />
          <span>Test Direct Link (No Login)</span>
        </a>
      </div>

      <div className="poster-scale-wrapper">
        <div ref={cardRef} className="qr-poster">
          {/* Top Left Swooshes */}
          <svg className="poster-bg-top" viewBox="0 0 650 400" preserveAspectRatio="none">
            <path d="M120,130 C130,-10 380,-10 380,-10 C380,-10 120,-30 80,100 Z" fill="#ff5e00" />
            <path d="M100,160 C120,0 350,-10 350,-10 C350,-10 90,0 60,150 Z" fill="#06113c" />
            
            <polygon points="65,210 75,200 85,210" fill="#06113c" />
            <polygon points="60,225 70,215 80,225" fill="#ff5e00" />
            <polygon points="45,210 55,200 65,210" fill="#06113c" />
          </svg>

          {/* Bottom Right Wave */}
          <svg className="poster-bg-bottom" viewBox="0 0 650 350" preserveAspectRatio="none">
            <path d="M-50,350 Q250,150 700,200 L700,350 Z" fill="#ff5e00" />
            <path d="M-50,350 Q300,180 700,220 L700,350 Z" fill="#06113c" />
          </svg>

          <div className="poster-content">
            <div className="poster-header">
              {/* Graduation Cap SVG */}
              <svg className="grad-cap-overlay" viewBox="0 0 100 100">
                <path d="M50,15 L95,35 L50,55 L5,35 Z" fill="#06113c" />
                <path d="M25,43 L25,70 Q50,85 75,70 L75,43 L50,55 Z" fill="#06113c" />
                <path d="M50,35 L85,55" stroke="#ff5e00" strokeWidth="3" />
                <circle cx="85" cy="60" r="4" fill="#ff5e00" />
                <rect x="83" y="60" width="4" height="20" fill="#ff5e00" />
              </svg>

              <h1 className="title-orientation" data-text="Orientation">Orientation</h1>
              <h1 className="title-qr-code">PAY & REGISTER</h1>
              <div className="qr-underline"></div>

              {/* Razorpay Badge */}
              <div className="poster-razorpay-tag">
                <CreditCard size={16} />
                <span>Razorpay Gateway Integrated</span>
              </div>

              <div className="subtitle-container">
                <div className="subtitle-line">
                  <div className="line-main"></div>
                  <div className="line-accent"></div>
                </div>
                <p className="poster-subtitle">
                  Scan this QR code to access student registration &<br />complete instant payment without any login.
                </p>
                <div className="subtitle-line">
                  <div className="line-accent"></div>
                  <div className="line-main"></div>
                </div>
              </div>
            </div>

            {/* Central Polygons */}
            <div className="orange-polygon-bg"></div>
            <div className="blue-polygon-bg"></div>

            <div className="qr-frame-outer">
              <svg style={{ position: 'absolute', top: '-2px', right: '-2px', width: '40px', height: '40px', zIndex: 12 }}>
                <path d="M20,0 L40,20 M30,0 L40,10 M10,0 L40,30" stroke="#ff5e00" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
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
                <span>SCAN TO PAY</span>
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
