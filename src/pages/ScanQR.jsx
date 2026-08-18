import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';
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
        pixelRatio: 2 // For high resolution
      });
      
      const downloadLink = document.createElement("a");
      downloadLink.download = "Orientation-QR-Page.png";
      downloadLink.href = dataUrl;
      downloadLink.click();
    } catch (err) {
      console.error("Failed to generate image", err);
    }
  };

  const qrUrl = import.meta.env.VITE_ORIENTATION_URL || "http://localhost:6001/orientation";

  return (
    <div className="scan-qr-container">
      <div className="glass-card qr-card">
        {/* The wrapper we want to capture */}
        <div ref={cardRef} className="qr-capture-area" style={{ padding: '2rem', background: '#ffffff', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="qr-header">
            <h2>Orientation QR Code</h2>
            <p>Scan this code to easily access the Orientation<br/>Enrollment form.</p>
          </div>

          <div className="qr-code-display">
            <QRCodeSVG 
              value={qrUrl} 
              size={250}
              level={"H"}
              includeMargin={true}
              bgColor={"#ffffff"}
              fgColor={"#1e1b4b"}
            />
          </div>

          <div className="qr-url-display" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
            <span>{qrUrl}</span>
          </div>
        </div>

        <button className="download-btn" onClick={handleDownload}>
          <Download size={20} />
          <span>Download QR Code</span>
        </button>
      </div>
    </div>
  );
};

export default ScanQR;
