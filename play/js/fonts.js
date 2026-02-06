import { config } from './config.js';
import { showToast } from './utils.js';
import { generateGrid } from './grid.js';

export let availableFonts = {};

function loadDynamicFontFaces(fonts) {
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-font-faces';
    
    for (let fontName in fonts) {
        const font = fonts[fontName];
        font.cssFamilies.forEach((family, i) => {
            const style = font.styles[i];
            const weight = style.includes('Bold') ? 'bold' : 'normal';
            const fontStyle = style.includes('Italic') ? 'italic' : 'normal';
            const fileName = `${fontName}-${style}.woff2`;
            
            styleEl.innerHTML += `
                @font-face {
                    font-family: '${family}';
                    src: url('fonts/${fileName}') format('woff2');
                    font-weight: ${weight};
                    font-style: ${fontStyle};
                    font-display: block;
                }
            `;
        });
    }
    
    const oldStyle = document.getElementById('dynamic-font-faces');
    if (oldStyle) oldStyle.remove();
    
    document.head.appendChild(styleEl);
}

export function populateFontSelect() {
    const fontSelect = document.getElementById('fontSelect');
    if (!fontSelect) return;
    
    fontSelect.innerHTML = '';
    
    const sortedFonts = Object.keys(availableFonts).sort((a, b) => {
        const yearDiff = availableFonts[b].year - availableFonts[a].year;
        if (yearDiff !== 0) return yearDiff;
        return a.localeCompare(b);
    });
    
    sortedFonts.forEach(fontName => {
        const fontData = availableFonts[fontName];
        const option = document.createElement('option');
        option.value = fontName;
        option.text = `${fontName} (${fontData.author}, ${fontData.year})`;
        option.title = `${fontData.author} · ${fontData.year}`;
        
        if (fontData.year >= 2026) {
            option.text += ' 🆕';
        } else if (fontData.year === 2025) {
            option.text += ' ★';
        }
        
        fontSelect.appendChild(option);
    });
    
    if (sortedFonts.length > 0) {
        const newestFont = sortedFonts[0];
        fontSelect.value = newestFont;
        config.lastFontName = newestFont;
    }
    
    updateStyleDropdown();
}

export function updateStyleDropdown() {
    const styleSelect = document.getElementById('styleSelect');
    const fontData = availableFonts[config.lastFontName];
    
    if (!fontData || !styleSelect) return;
    
    styleSelect.innerHTML = '';
    fontData.styles.forEach((style, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = style;
        styleSelect.appendChild(option);
    });
    
    styleSelect.value = config.lastStyleIndex;
}

export function loadFonts() {
    fetch('fonts.json')
        .then(res => {
            if (!res.ok) throw new Error('Not found');
            return res.json();
        })
        .then(data => {
            availableFonts = data;
            loadDynamicFontFaces(data);
            populateFontSelect();
            updateStyleDropdown();

            const firstFont = Object.keys(data)[0];
            if (firstFont) {
                config.lastFontName = firstFont;
                config.activeText = data[firstFont].sampleText;
            }

            document.getElementById('loader').style.display = 'none';
            if (window.currentP) generateGrid();

            showToast(`Loaded ${Object.keys(data).length} fonts dynamically`, 'success');
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'fonts_loaded_dynamic', {
                    'event_category': 'fonts',
                    'event_label': 'json',
                    'value': Object.keys(data).length
                });
            }
        })
        .catch(err => {
            console.log('Using system font fallback:', err);
            
            availableFonts = {
                'Sans-serif': {
                    sampleText: 'Typography playground - fonts.json not loaded',
                    styles: ['Regular'],
                    cssFamilies: ['sans-serif'],
                    author: 'System',
                    year: new Date().getFullYear()
                }
            };
            
            populateFontSelect();
            config.activeText = availableFonts['Sans-serif'].sampleText;
            document.getElementById('loader').style.display = 'none';
            if (window.currentP) generateGrid();
            
            showToast("Using system font", 'info');
        });
}