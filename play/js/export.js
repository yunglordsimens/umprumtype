import { config } from './config.js';
import { showToast } from './utils.js';

export function exportPNG() {
    let canvas = document.querySelector('canvas');
    if (!canvas) {
        showToast("No canvas found", 'error');
        return;
    }
    
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    ctx.drawImage(canvas, 0, 0);
    
    ctx.font = '14px Helvetica Neue';
    ctx.fillStyle = config.darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Typo Umprum Playground v3.1', canvas.width - 20, canvas.height - 20);
    ctx.fillText(new Date().toLocaleDateString(), canvas.width - 20, canvas.height - 5);
    
    let link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `typo-umprum-${timestamp}.png`;
    link.href = tempCanvas.toDataURL('image/png', 1.0);
    link.click();
    
    showToast("PNG exported with watermark", 'success');
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'export_png_v3_1_final', {
            'event_category': 'export',
            'event_label': 'png',
            'value': canvas.width * canvas.height
        });
    }
}

export function exportPDF() {
    let canvas = document.querySelector('canvas');
    if (!canvas) {
        showToast("No canvas found", 'error');
        return;
    }
    
    if (typeof window.jspdf === 'undefined') {
        showToast("PDF export requires jsPDF library", 'error');
        return;
    }
    
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
    
    ctx.font = '14px Helvetica Neue';
    ctx.fillStyle = config.darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Typo Umprum Playground v3.1', canvas.width - 20, canvas.height - 20);
    ctx.fillText(new Date().toLocaleDateString(), canvas.width - 20, canvas.height - 5);
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });
    
    const imgData = tempCanvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    pdf.save(`typo-umprum-${timestamp}.pdf`);
    
    showToast("PDF exported with watermark", 'success');
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'export_pdf_v3_1_final', {
            'event_category': 'export',
            'event_label': 'pdf'
        });
    }
}

export function shareOnTwitter() {
    const text = encodeURIComponent("Check out my typography creation with Typo Umprum Playground v3.1! #TypoUmprum #Typography #Design");
    const url = encodeURIComponent('https://typoumprum.cz/play');
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, '_blank');
    
    setTimeout(() => {
        showToast("Don't forget to export your PNG first to attach to the tweet!", 'info', 3000);
    }, 500);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'share_twitter_v3_1_final', {
            'event_category': 'social',
            'event_label': 'twitter'
        });
    }
}