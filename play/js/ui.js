import { config, defaultConfig } from './config.js';
import { updateSettings, updateUIFromConfig, updateDensitySliderMax } from './canvas.js';
import { generateGrid } from './grid.js';
import { availableFonts } from './fonts.js';
import { showToast, toggleDarkMode, toggleFreeze, showShortcutsHelp } from './utils.js';
import { exportPNG, exportPDF, shareOnTwitter } from './export.js';

function bindSlider(id, configKey, formatFn, onChange = null) {
    const slider = document.getElementById(id);
    const display = document.getElementById(id.replace('Slider', 'Value'));
    if (!slider || !display) return;
    
    slider.addEventListener('input', () => {
        const val = slider.value;
        display.textContent = formatFn(val);
        
        if (configKey === 'targetGlyphCount') {
            config[configKey] = parseInt(val);
        } else if (configKey === 'maxScale') {
            config[configKey] = parseFloat(val);
        } else {
            config[configKey] = parseInt(val);
        }
        
        if (onChange) onChange();
    });
}

function bindToggle(id, configKey, eventName = null) {
    const toggle = document.getElementById(id);
    if (!toggle) return;
    
    toggle.addEventListener('change', function() {
        config[configKey] = this.checked;
        
        if (eventName && typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                'event_category': 'effects',
                'event_label': this.checked ? 'enabled' : 'disabled'
            });
        }
    });
}

export function resetAll() {
    Object.keys(defaultConfig).forEach(key => {
        config[key] = defaultConfig[key];
    });
    
    const customInput = document.getElementById('customInput');
    if (customInput) customInput.value = '';
    
    updateUIFromConfig();
    updateDensitySliderMax();
    document.querySelectorAll('#tools-panel input[type=checkbox]').forEach(cb => cb.checked = false);
    generateGrid();
    
    showToast('All settings reset to defaults', 'success');
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'reset_all_v3_1_final', {
            'event_category': 'actions',
            'event_label': 'full_reset'
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Mobile toggle
    const mobileToggle = document.getElementById('mobile-toggle-btn');
    const toolsPanel = document.getElementById('tools-panel');
    
    if (mobileToggle && toolsPanel) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = toolsPanel.style.display === 'flex';
            toolsPanel.style.display = isOpen ? 'none' : 'flex';
            document.body.style.overflow = isOpen ? 'visible' : 'hidden';
            mobileToggle.textContent = isOpen ? '⚙️' : '✕';
        });
        
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 800 && 
                toolsPanel.style.display === 'flex' &&
                !toolsPanel.contains(e.target) && 
                e.target !== mobileToggle) {
                toolsPanel.style.display = 'none';
                document.body.style.overflow = 'visible';
                mobileToggle.textContent = '⚙️';
            }
        });
    }
    
    // Font selection
    const fontSelect = document.getElementById('fontSelect');
    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            config.lastFontName = e.target.value;
            config.activeText = availableFonts[config.lastFontName].sampleText;
            updateSettings();
        });
    }
    
    // Style selection
    const styleSelect = document.getElementById('styleSelect');
    if (styleSelect) {
        styleSelect.addEventListener('change', (e) => {
            config.lastStyleIndex = e.target.selectedIndex;
            updateSettings();
        });
    }
    
    // Text controls
    const applyTextBtn = document.getElementById('applyTextBtn');
    if (applyTextBtn) {
        applyTextBtn.addEventListener('click', updateSettings);
    }
    
    const customInput = document.getElementById('customInput');
    if (customInput) {
        customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                updateSettings();
            }
        });
        
        customInput.addEventListener('input', function() {
            const count = this.value.length;
            const charCount = document.getElementById('char-count');
            if (charCount) charCount.textContent = `${count} chars`;
        });
    }
    
    const sampleTextBtn = document.getElementById('sample-text-btn');
    if (sampleTextBtn) {
        sampleTextBtn.addEventListener('click', () => {
            const fontData = availableFonts[config.lastFontName];
            if (fontData && customInput) {
                customInput.value = fontData.sampleText;
                updateSettings();
            }
        });
    }
    
    // Action buttons
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAll);
    }
    
    const exportPngBtn = document.getElementById('exportPngBtn');
    if (exportPngBtn) {
        exportPngBtn.addEventListener('click', exportPNG);
    }
    
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportPDF);
    }
    
    const shareTweetBtn = document.getElementById('shareTweetBtn');
    if (shareTweetBtn) {
        shareTweetBtn.addEventListener('click', shareOnTwitter);
    }
    
    const shortcutsBtn = document.getElementById('shortcuts-btn');
    if (shortcutsBtn) {
        shortcutsBtn.addEventListener('click', showShortcutsHelp);
    }
    
    // Slider bindings
    bindSlider('densitySlider', 'targetGlyphCount', v => `${v} glyphs`, () => {
        generateGrid();
    });
    
    bindSlider('radiusSlider', 'interactionRadius', v => `${v}px`);
    bindSlider('scaleSlider', 'maxScale', v => `${parseFloat(v).toFixed(1)}x`);
    
    // Toggle bindings
    bindToggle('darkToggle', 'darkMode');
    bindToggle('waveToggle', 'waveEffect', 'wave_effect_toggle_final');
    bindToggle('bloomToggle', 'bloomEffect', 'bloom_effect_toggle_final');
    bindToggle('scatterToggle', 'scatterEffect', 'scatter_effect_toggle_final');
    
    // Initialize UI
    setTimeout(() => {
        updateUIFromConfig();
        updateDensitySliderMax();
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'v3_1_final_launch', {
                'event_category': 'version',
                'event_label': 'final_perlin_modular'
            });
        }
    }, 100);
});

window.addEventListener('error', function(e) {
    console.error('Runtime error:', e.error);
    showToast("An error occurred - please refresh", 'error');
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'error_v3_1_final', {
            'event_category': 'system',
            'event_label': e.error.message,
            'value': 1
        });
    }
});