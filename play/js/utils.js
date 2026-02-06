import { config } from './config.js';

let frameTimes = [];
let lastFrameTime = performance.now();
let lowFPSWarningShown = false;

export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, duration);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'toast_shown', {
            'event_category': 'ui',
            'event_label': type,
            'value': duration
        });
    }
}

export function checkPerformance() {
    const now = performance.now();
    const delta = now - lastFrameTime;
    lastFrameTime = now;
    
    frameTimes.push(delta);
    if (frameTimes.length > 60) frameTimes.shift();
    
    const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
    const fps = Math.round(1000 / avgFrameTime);
    
    const indicator = document.getElementById('performance-indicator');
    if (indicator) {
        indicator.textContent = `FPS: ${fps} | Glyphs: ${window.grid?.length || 0}`;
        
        if (fps < 45) {
            indicator.style.display = 'block';
            if (fps < 30) {
                indicator.classList.add('low');
                
                if ((config.scatterEffect || config.waveEffect) && !lowFPSWarningShown) {
                    config.scatterEffect = false;
                    config.waveEffect = false;
                    const scatterToggle = document.getElementById('scatterToggle');
                    const waveToggle = document.getElementById('waveToggle');
                    if (scatterToggle) scatterToggle.checked = false;
                    if (waveToggle) waveToggle.checked = false;
                    showToast("Disabled effects for better performance", 'warning');
                    lowFPSWarningShown = true;
                    
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'auto_effect_disable', {
                            'event_category': 'performance',
                            'event_label': 'scatter_wave',
                            'value': fps
                        });
                    }
                }
            } else {
                indicator.classList.remove('low');
            }
        } else {
            indicator.style.display = 'none';
            indicator.classList.remove('low');
            lowFPSWarningShown = false;
        }
    }
    
    return fps;
}

export function toggleFreeze() {
    config.paused = !config.paused;
    document.body.classList.toggle('frozen-mode', config.paused);
    
    if (config.paused) {
        showToast("Canvas frozen (press space to resume) — perfect for capture!", 'info', 2000);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'freeze_toggle', {
                'event_category': 'interaction',
                'event_label': 'spacebar',
                'value': 1
            });
        }
    } else {
        showToast("Canvas unfrozen", 'info', 1000);
    }
}

export function toggleDarkMode() {
    config.darkMode = !config.darkMode;
    const darkToggle = document.getElementById('darkToggle');
    if (darkToggle) darkToggle.checked = config.darkMode;
    document.body.classList.toggle('dark-mode', config.darkMode);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'dark_mode_toggle', {
            'event_category': 'ui',
            'event_label': config.darkMode ? 'enabled' : 'disabled'
        });
    }
}

export function showShortcutsHelp() {
    showToast(
        "Keyboard Shortcuts:<br>" +
        "Space = Freeze/unfreeze canvas<br>" +
        "D = Toggle dark mode<br>" +
        "R = Reset all settings<br>" +
        "S = Export PNG<br>" +
        "P = Export PDF<br>" +
        "T = Share on X/Twitter<br>" +
        "W = Toggle wave effect<br>" +
        "B = Toggle bloom effect<br>" +
        "C = Toggle scatter effect<br>" +
        "Arrows = Adjust sliders<br>" +
        "ESC = Close mobile panel<br>" +
        "? = Show this help",
        'info',
        5000
    );
}

export function toggleEffect(toggleId, configProp) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
        toggle.checked = !toggle.checked;
        config[configProp] = toggle.checked;
        
        showToast(`${configProp.replace('Effect', '')} effect ${toggle.checked ? 'enabled' : 'disabled'}`, 'info');
    }
}

export function adjustSlider(sliderId, delta) {
    const slider = document.getElementById(sliderId);
    if (slider) {
        const current = parseFloat(slider.value);
        const step = parseFloat(slider.step) || 1;
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 100;
        const newValue = Math.min(max, Math.max(min, current + delta * step));
        slider.value = newValue;
        slider.dispatchEvent(new Event('input'));
    }
}

export function closeMobilePanel() {
    const toolsPanel = document.getElementById('tools-panel');
    const mobileToggle = document.getElementById('mobile-toggle-btn');
    
    if (window.innerWidth <= 800 && toolsPanel && toolsPanel.style.display === 'flex') {
        toolsPanel.style.display = 'none';
        document.body.style.overflow = 'visible';
        if (mobileToggle) mobileToggle.textContent = '⚙️';
    }
}

export const keyboardShortcuts = {
    ' ': toggleFreeze,
    'd': toggleDarkMode,
    'r': () => window.resetAll?.(),
    's': () => document.getElementById('exportPngBtn')?.click(),
    'p': () => document.getElementById('exportPdfBtn')?.click(),
    't': () => document.getElementById('shareTweetBtn')?.click(),
    'w': () => toggleEffect('waveToggle', 'waveEffect'),
    'b': () => toggleEffect('bloomToggle', 'bloomEffect'),
    'c': () => toggleEffect('scatterToggle', 'scatterEffect'),
    'Escape': closeMobilePanel,
    'ArrowUp': () => adjustSlider('scaleSlider', 0.1),
    'ArrowDown': () => adjustSlider('scaleSlider', -0.1),
    'ArrowLeft': () => adjustSlider('radiusSlider', -10),
    'ArrowRight': () => adjustSlider('radiusSlider', 10),
    '?': showShortcutsHelp
};

export function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        
        if (activeElement && 
            (activeElement.tagName === 'INPUT' || 
             activeElement.tagName === 'TEXTAREA' || 
             activeElement.tagName === 'SELECT') && 
            e.key !== 'Escape') {
            return;
        }
        
        const key = e.key.toLowerCase();
        if (keyboardShortcuts[key]) {
            e.preventDefault();
            keyboardShortcuts[key](e);
        } else if (keyboardShortcuts[e.key]) {
            e.preventDefault();
            keyboardShortcuts[e.key](e);
        }
    });
}