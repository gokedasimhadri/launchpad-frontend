import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';
import './ScanQR.css';

const ScanQR = () => {
  const qrRef = useRef();

  const handleDownload = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    // Set up canvas dimensions to be larger for better quality
    const size = 1000;
    canvas.width = size;
    canvas.height = size;
    
    img.onload = () => {
      // Draw white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);
      // Draw SVG on top
      ctx.drawImage(img, 0, 0, size, size);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "Orientation-QR.png";
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const qrUrl = import.meta.env.VITE_ORIENTATION_URL || "http://localhost:6001/orientation";

  return (
    <div className="scan-qr-container">
      <div className="glass-card qr-card">
        <div className="qr-header">
          <div className="qr-icon-wrapper">
            <QrCode size={32} />
          </div>
          <h2>Orientation QR Code</h2>
          <p>Scan this code to easily access the Orientation Enrollment form.</p>
        </div>

        <div className="qr-code-display" ref={qrRef}>
          <QRCodeSVG 
            value={qrUrl} 
            size={250}
            level={"H"}
            includeMargin={true}
            bgColor={"#ffffff"}
            fgColor={"#1e1b4b"}
          />
        </div>

        <div className="qr-url-display">
          <span>{qrUrl}</span>
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
