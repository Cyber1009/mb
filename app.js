// Global variables
let cv = null;
let currentImage = null;
let selectedBackground = 'original';

// Background options - Traditional Chinese calligraphy inspired
const backgroundOptions = [
    { name: 'Original', value: 'original', color: 'transparent', isOriginal: true },
    { name: 'Pure White', value: 'default', color: '#ffffff' },
    { name: 'Rice Paper', value: 'rice', color: '#faf8f3' },
    { name: 'Aged Parchment', value: 'parchment', color: '#f5f1e8' },
    { name: 'Silk Scroll', value: 'silk', color: '#f7f3e9' },
    { name: 'Bamboo Paper', value: 'bamboo', color: '#f2f0e6' },
    { name: 'Tea Stained', value: 'tea', color: '#f0ede4' }
];

// Mobile detection function
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0);
}

// Simple mobile status update (non-debug version)
function updateMobileStatus() {
    // This function can be empty for production or just log status
    const isMobile = isMobileDevice();
    console.log('Mobile device detected:', isMobile);
}

// Simple debug log function (non-intrusive version)
function debugLog(message) {
    console.log('[DEBUG]', message);
}

// Wait for OpenCV to load
function onOpenCvReady() {
    cv = window.cv;
    console.log('OpenCV.js is ready');
    initializeApp();
}

// Fallback initialization if OpenCV doesn't load
window.addEventListener('load', function() {
    // Wait a bit for OpenCV to potentially load
    setTimeout(function() {
        if (!cv && window.cv) {
            console.log('OpenCV loaded after window load, initializing...');
            cv = window.cv;
            initializeApp();
        } else if (!cv) {
            console.log('OpenCV not loaded, initializing basic functionality...');
            initializeApp();
        }
    }, 2000);
});

function initializeApp() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            logBrowserInfo();
            testDragCapability();
            setupEventListeners();
            populateBackgroundOptions();
            loadBackgroundImages();
            updateMobileStatus();
        });
    } else {
        logBrowserInfo();
        testDragCapability();
        setupEventListeners();
        populateBackgroundOptions();
        loadBackgroundImages();
        updateMobileStatus();
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // File input
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
    
    // Threshold slider
    const thresholdSlider = document.getElementById('thresholdSlider');
    thresholdSlider.addEventListener('input', function() {
        document.getElementById('thresholdValue').textContent = this.value;
        if (currentImage) {
            processImageRealtime(); // Lightweight real-time updates
        }
    });
      // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadResult);
    
    // Background selection
    document.addEventListener('click', function(e) {
        if (e.target.closest('.background-option')) {
            selectBackground(e.target.closest('.background-option'));
        }
    });
    
    // Enhanced zoom and drag functionality
    setupZoomAndDrag();
      // Window resize handler for mobile orientation changes
    window.addEventListener('resize', function() {
        if (currentImage) {
            updateContainerSize(currentImage);
        }
        // Update mobile status on resize (useful for F12 DevTools)
        setTimeout(updateMobileStatus, 100);
    });
}

function populateBackgroundOptions() {
    const container = document.getElementById('backgroundSelect');
    container.innerHTML = '';
    
    backgroundOptions.forEach((bg, index) => {
        const option = document.createElement('div');
        option.className = `background-option ${index === 0 ? 'selected' : ''}`;
        option.dataset.bg = bg.value;
        
        const preview = document.createElement('div');
        preview.style.width = '50px';
        preview.style.height = '50px';
        preview.style.border = '1px solid #e8e6e0';
        preview.style.borderRadius = '6px';
        preview.className = 'background-preview';
        
        if (bg.isOriginal) {
            // Special styling for original option
            preview.style.background = 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)';
            preview.style.backgroundSize = '8px 8px';
            preview.style.backgroundPosition = '0 0, 0 4px, 4px -4px, -4px 0px';
            preview.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">📷</div>';
        } else {
            preview.style.backgroundColor = bg.color;
        }
        
        const label = document.createElement('div');
        label.textContent = bg.name;
        label.className = 'background-label';
        
        option.appendChild(preview);
        option.appendChild(label);
        container.appendChild(option);
    });
}

function loadBackgroundImages() {
    // Load actual background images from the background folder
    const backgroundImages = ['background.jpg', 'background_h.jpg', 'background_v.jpg'];
    
    backgroundImages.forEach(filename => {
        const option = document.createElement('div');
        option.className = 'background-option';
        option.dataset.bg = filename;
        
        const img = document.createElement('img');
        img.src = `background/${filename}`;
        img.className = 'background-preview';
        img.alt = filename;
        img.onerror = function() {
            // If image fails to load, remove this option
            option.remove();
        };
        
        const label = document.createElement('div');
        label.textContent = filename.replace('.jpg', '').replace('_', ' ').toUpperCase();
        label.className = 'background-label';
        
        option.appendChild(img);
        option.appendChild(label);
        document.getElementById('backgroundSelect').appendChild(option);
    });
}

function selectBackground(option) {
    // Remove selected class from all options
    document.querySelectorAll('.background-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    option.classList.add('selected');
    selectedBackground = option.dataset.bg;
    
    // Update display based on selection
    if (currentImage) {
        if (selectedBackground === 'original') {
            // Show original image preview
            displayOriginalImage();
        } else {
            // Process image with selected background
            processImageRealtime(); // Lightweight real-time updates
        }
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        showError('Please select a valid image file (PNG, JPG, JPEG)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();        img.onload = function() {
            currentImage = img;
            updateContainerSize(img);
            displayImagePreview(img);
            hideError();
            
            // Auto-process on image load if not original background
            if (selectedBackground !== 'original') {
                processImage();
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateContainerSize(img) {
    const container = document.querySelector('.canvas-container');
    if (!container || !img) return;
    
    // Calculate aspect ratio
    const aspectRatio = img.width / img.height;
    
    // Remove existing aspect ratio classes
    container.classList.remove('landscape', 'portrait', 'square');
    
    // Add appropriate class based on aspect ratio
    if (aspectRatio > 1.3) {
        container.classList.add('landscape');
    } else if (aspectRatio < 0.7) {
        container.classList.add('portrait');
    } else {
        container.classList.add('square');
    }
    
    // For mobile devices, adjust min-height more aggressively
    if (window.innerWidth <= 768) {
        if (aspectRatio > 1.5) {
            container.style.minHeight = '200px';
        } else if (aspectRatio < 0.6) {
            container.style.minHeight = '400px';
        } else {
            container.style.minHeight = '300px';
        }
    }
}

function displayImagePreview(img) {
    const preview = document.getElementById('imagePreview');
    const canvas = document.getElementById('resultCanvas');
    const placeholder = document.getElementById('previewInstructions');
    
    preview.src = img.src;
    
    // Hide placeholder when image is loaded
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Show appropriate preview based on selected background
    if (selectedBackground === 'original') {
        displayOriginalImage();
    } else {
        // For non-original backgrounds, we'll process and show canvas
        preview.style.display = 'none';
        canvas.style.display = 'none'; // Will be shown after processing
    }
    
    updateContainerSize(img);
    
    // IMPORTANT: Re-setup zoom and drag events when image is displayed
    setTimeout(() => {
        console.log('Re-setting up zoom events for displayed image');
        const preview = document.getElementById('imagePreview');
        const canvas = document.getElementById('resultCanvas');
        
        if (preview && preview.style.display !== 'none') {
            setupImageEvents(preview);
            console.log('Zoom events setup for preview image');
        }
        if (canvas && canvas.style.display !== 'none') {
            setupImageEvents(canvas);
            console.log('Zoom events setup for canvas');
        }
    }, 100); // Small delay to ensure DOM is updated
}

function displayOriginalImage() {
    const preview = document.getElementById('imagePreview');
    const canvas = document.getElementById('resultCanvas');
    const placeholder = document.getElementById('previewInstructions');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Hide placeholder
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Show original image, hide processed canvas
    preview.style.display = 'block';
    canvas.style.display = 'none';
    downloadBtn.style.display = 'inline-block'; // Allow download of original
    
    // IMPORTANT: Setup zoom events for the displayed image
    setTimeout(() => {
        console.log('Setting up zoom events for original image display');
        setupImageEvents(preview);
    }, 50);
}

// Debounce function (kept for potential future use, but not used for threshold slider)
let processTimeout;
function debounceProcess() {
    clearTimeout(processTimeout);
    processTimeout = setTimeout(processImage, 300);
}

// Lightweight real-time processing without UI loading indicators
function processImageRealtime() {
    if (!cv || !currentImage) {
        return;
    }
    
    // If original is selected, just show the original image
    if (selectedBackground === 'original') {
        displayOriginalImage();
        return;
    }
    
    try {
        // Create canvas for input image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        ctx.drawImage(currentImage, 0, 0);
        
        // Load image into OpenCV
        const src = cv.imread(canvas);
        const gray = new cv.Mat();
        const binary = new cv.Mat();
        
        // Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // Apply threshold
        const threshValue = parseInt(document.getElementById('thresholdSlider').value);
        cv.threshold(gray, binary, threshValue, 255, cv.THRESH_BINARY_INV);
        
        // Remove small noise (morphological opening)
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        cv.morphologyEx(binary, binary, cv.MORPH_OPEN, kernel, new cv.Point(-1, -1), 1);
        
        // Create result image with background
        const result = createBackgroundImage(canvas.width, canvas.height);
        
        // Apply calligraphy to background
        applyCalligraphyToBackground(binary, result);
        
        // Display preview (this will switch from original to processed)
        displayResult(result);
        
        // Cleanup
        src.delete();
        gray.delete();
        binary.delete();
        kernel.delete();
        
    } catch (error) {
        console.error('Real-time processing error:', error);
        // Don't show error UI for real-time updates
    }
}

function processImage() {
    if (!cv || !currentImage) {
        showError('OpenCV not loaded or no image selected');
        return;
    }
    
    // If original is selected, just show the original image
    if (selectedBackground === 'original') {
        displayOriginalImage();
        return;
    }
    
    showLoading();
    hideError();
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
        try {
            updateProgress(10, 'Preparing the canvas...');
            
            // Create canvas for input image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = currentImage.width;
            canvas.height = currentImage.height;
            ctx.drawImage(currentImage, 0, 0);
            
            updateProgress(20, 'Reading the image essence...');
            
            // Load image into OpenCV
            const src = cv.imread(canvas);
            const gray = new cv.Mat();
            const binary = new cv.Mat();
            
            updateProgress(40, 'Converting to ink wash...');
            
            // Convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            
            updateProgress(60, 'Applying brush sensitivity...');
            
            // Apply threshold
            const threshValue = parseInt(document.getElementById('thresholdSlider').value);
            cv.threshold(gray, binary, threshValue, 255, cv.THRESH_BINARY_INV);
            
            updateProgress(70, 'Refining brush strokes...');
            
            // Remove small noise (morphological opening)
            const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
            cv.morphologyEx(binary, binary, cv.MORPH_OPEN, kernel, new cv.Point(-1, -1), 1);
            
            updateProgress(80, 'Preparing traditional paper...');
              // Create preview image with background
            const result = createBackgroundImage(canvas.width, canvas.height);
            
            updateProgress(90, 'Harmonizing ink and paper...');
            
            // Apply calligraphy to background
            applyCalligraphyToBackground(binary, result);
            
            updateProgress(100, 'Creating masterpiece...');
            
            // Display preview
            displayResult(result);
            
            // Cleanup
            src.delete();
            gray.delete();
            binary.delete();
            kernel.delete();
            
            hideLoading();
            
        } catch (error) {
            console.error('Processing error:', error);
            showError('Error processing image: ' + error.message);
            hideLoading();
        }
    }, 100);
}

function createBackgroundImage(width, height) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    // Handle original option - return original image as background
    if (selectedBackground === 'original') {
        ctx.drawImage(currentImage, 0, 0, width, height);
        return canvas;
    }
    
    if (selectedBackground === 'default' || backgroundOptions.find(bg => bg.value === selectedBackground)) {
        // Use solid color background
        const bgOption = backgroundOptions.find(bg => bg.value === selectedBackground);
        const color = bgOption ? bgOption.color : '#ffffff';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
    } else {
        // Try to load background image
        const bgImg = document.querySelector(`.background-option[data-bg="${selectedBackground}"] img`);
        if (bgImg && bgImg.complete) {
            ctx.drawImage(bgImg, 0, 0, width, height);
        } else {
            // Fallback to white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    return canvas;
}

function applyCalligraphyToBackground(binaryMat, backgroundCanvas) {
    const ctx = backgroundCanvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    const data = imageData.data;
    
    // Get binary image data
    const binaryData = binaryMat.data;
    const width = binaryMat.cols;
    const height = binaryMat.rows;
    
    // Apply calligraphy (set pixels to black where binary is white)
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const binaryIndex = i * width + j;
            const imageIndex = (i * width + j) * 4;
            
            if (binaryData[binaryIndex] === 255) { // White in binary = text
                data[imageIndex] = 0;     // R
                data[imageIndex + 1] = 0; // G
                data[imageIndex + 2] = 0; // B
                // Alpha remains unchanged
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function displayResult(canvas) {
    const resultCanvas = document.getElementById('resultCanvas');
    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('previewInstructions');
    const ctx = resultCanvas.getContext('2d');
    
    resultCanvas.width = canvas.width;
    resultCanvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
    
    // Hide placeholder
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Show processed canvas, hide original image
    resultCanvas.style.display = 'block';
    preview.style.display = 'none';
    
    document.getElementById('downloadBtn').style.display = 'inline-block';
    
    // IMPORTANT: Setup zoom events for the displayed canvas
    setTimeout(() => {
        console.log('Setting up zoom events for result canvas');
        setupImageEvents(resultCanvas);
    }, 50);
}

function downloadResult() {
    let canvas;
    
    if (selectedBackground === 'original') {
        // Create a canvas with the original image for download
        canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        ctx.drawImage(currentImage, 0, 0);
    } else {
        // Use the processed result canvas
        canvas = document.getElementById('resultCanvas');
    }
    
    if (!canvas) return;
    
    // Create download link with traditional naming
    canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const suffix = selectedBackground === 'original' ? 'original' : 'ink_harmony';
        a.download = `${suffix}_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.9);
}

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
    document.getElementById('progressContainer').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('progressContainer').style.display = 'none';
}

function updateProgress(percent, text) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressBar.style.width = percent + '%';
    progressText.textContent = text;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (typeof cv !== 'undefined') {
        onOpenCvReady();
    }
});



// Enhanced mobile detection
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0);
}





function logBrowserInfo() {
    const info = {
        userAgent: navigator.userAgent,
        isChrome: navigator.userAgent.includes('Chrome'),
        isVSCodeBrowser: navigator.userAgent.includes('VSCode'),
        touchSupport: 'ontouchstart' in window,
        pointerEvents: 'PointerEvent' in window,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    };
    
    console.log('Browser Info:', info);
    debugLog(`Browser: ${info.isChrome ? 'Chrome' : (info.isVSCodeBrowser ? 'VSCode' : 'Other')}`);
    debugLog(`Touch: ${info.touchSupport}, Pointer: ${info.pointerEvents}`);
    debugLog(`Viewport: ${info.viewport.width}x${info.viewport.height}`);
    
    return info;
}

// Test drag capability
function testDragCapability() {
    const testElement = document.createElement('div');
    testElement.style.cssText = `
        width: 50px; height: 50px; position: fixed; top: -100px; left: -100px;
        transform: translateZ(0); will-change: transform;
    `;
    document.body.appendChild(testElement);
    
    const supportsTransform = testElement.style.transform !== undefined;
    const supportsWillChange = testElement.style.willChange !== undefined;
    
    document.body.removeChild(testElement);
    
    console.log('Drag Capability Test:', { supportsTransform, supportsWillChange });
    debugLog(`Transform: ${supportsTransform}, WillChange: ${supportsWillChange}`);
    
    return { supportsTransform, supportsWillChange };
}

// Enhanced zoom and drag functionality
function setupZoomAndDrag() {
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let initialTransform = { x: 0, y: 0 };
    
    console.log('Setting up zoom and drag functionality');
    debugLog('Setting up zoom and drag functionality');    // Make setupImageEvents globally accessible for debugging
    window.setupImageEvents = setupImageEvents;
      function setupImageEvents(element) {
        if (!element) {
            console.log('setupImageEvents called with null/undefined element');
            return;
        }

        // Check if element already has zoom events
        if (element.hasAttribute('data-zoom-setup')) {
            console.log('Element already has zoom events setup, skipping');
            return;
        }

        console.log('Setting up zoom events for element:', element.id || element.tagName, element);
        debugLog(`Setting up zoom events for: ${element.id || element.tagName}`);

        let touchStartTime = 0;
        let touchMoved = false;
        let initialTouchPos = { x: 0, y: 0 };
        
        // Mark element as having zoom setup
        element.setAttribute('data-zoom-setup', 'true');
        
        // Prevent context menu on images for better drag experience
        element.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });// Click to zoom toggle (only for desktop or when no touch support)
        element.addEventListener('click', function(e) {
            console.log('Click detected on element, touch device:', isMobileDevice());
            // Only handle click if it's not a touch device OR it's a mouse click on mobile
            if (!isMobileDevice() || (e.detail && e.detail > 0)) {
                e.preventDefault();
                debugLog('Click zoom toggle (desktop mode)');
                toggleZoom(element);
            }
        });// Mouse events for drag (desktop)
        element.addEventListener('mousedown', function(e) {
            // Only handle left mouse button
            if (e.button !== 0) return;
            
            if (element.classList.contains('zoomed')) {
                e.preventDefault();
                e.stopPropagation(); // Important for Chrome
                startDrag(e, element);
            }
        });        // Touch events for mobile
        element.addEventListener('touchstart', function(e) {
            debugLog(`touchstart: touches=${e.touches.length}, zoomed=${element.classList.contains('zoomed')}`);
            
            // Only handle single touches
            if (e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            initialTouchPos = { x: touch.clientX, y: touch.clientY };
            touchStartTime = Date.now();
            touchMoved = false;
            
            // Only prevent default for zoomed images to avoid interfering with normal scrolling
            if (element.classList.contains('zoomed')) {
                e.preventDefault();
                debugLog('Starting drag from touchstart');
                startDrag(e, element);
            }
        }, { passive: false });        element.addEventListener('touchmove', function(e) {
            if (e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - initialTouchPos.x);
            const deltaY = Math.abs(touch.clientY - initialTouchPos.y);
            
            // Mark as moved if movement is significant (more than 5 pixels)
            if (deltaX > 5 || deltaY > 5) {
                touchMoved = true;
            }
            
            debugLog(`touchmove: delta=${deltaX.toFixed(1)},${deltaY.toFixed(1)}, moved=${touchMoved}`);
            
            // If we're dragging a zoomed image, handle the drag movement
            if (element.classList.contains('zoomed') && isDragging) {
                e.preventDefault();
                touchDrag(e);
            }
        }, { passive: false });        element.addEventListener('touchend', function(e) {
            debugLog(`touchend: changedTouches=${e.changedTouches.length}`);
            
            // Only handle single touch end
            if (e.changedTouches.length !== 1) return;
            
            const touchDuration = Date.now() - touchStartTime;
            
            debugLog(`touchend: duration=${touchDuration}ms, moved=${touchMoved}, zoomed=${element.classList.contains('zoomed')}`);
            
            // Stop any ongoing drag first
            if (isDragging) {
                debugLog('Stopping drag on touchend');
                stopDrag();
            }
            
            // Detect tap: quick touch (< 500ms) with minimal movement
            const isTap = touchDuration < 500 && !touchMoved;
            
            if (isTap) {
                e.preventDefault(); // Prevent ghost clicks
                debugLog(`Quick tap detected (${touchDuration}ms) - toggling zoom`);
                toggleZoom(element);
            }
            
            // Reset touch state
            touchMoved = false;
            touchStartTime = 0;
            initialTouchPos = { x: 0, y: 0 };
        }, { passive: false });        // Handle touch cancel (important for mobile)
        element.addEventListener('touchcancel', function(e) {
            debugLog('touchcancel detected - resetting state');
            touchMoved = false;
            touchStartTime = 0;
            initialTouchPos = { x: 0, y: 0 };
            
            // Stop any ongoing drag
            if (isDragging) {
                stopDrag();
            }
        }, { passive: false });
    }    function toggleZoom(element) {
        debugLog(`toggleZoom called, current state: ${element.classList.contains('zoomed') ? 'zoomed' : 'normal'}`);
        
        if (element.classList.contains('zoomed')) {
            // Zoom out
            element.classList.remove('zoomed', 'dragging');
            element.style.transform = '';            element.style.transformOrigin = 'center center';
            currentX = 0;
            currentY = 0;
        } else {
            // Zoom in
            element.classList.add('zoomed');
            element.style.transformOrigin = 'center center';
            element.style.transform = 'scale(2)';
        }
    }    function startDrag(event, element) {
        console.log('startDrag called');
        debugLog('startDrag called');
        
        isDragging = true;
        element.classList.add('dragging');
        
        // Get coordinates from either mouse or touch event
        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            // Touch event
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
            debugLog(`Touch coordinates: ${clientX}, ${clientY}`);
        } else {
            // Mouse event
            clientX = event.clientX;
            clientY = event.clientY;
            debugLog(`Mouse coordinates: ${clientX}, ${clientY}`);
        }
        
        startX = clientX - currentX;
        startY = clientY - currentY;
        
        debugLog(`Drag started: startX=${startX}, startY=${startY}, currentX=${currentX}, currentY=${currentY}`);
        console.log(`Drag started: startX=${startX}, startY=${startY}, currentX=${currentX}, currentY=${currentY}`);

        // Mouse events
        document.addEventListener('mousemove', drag, { passive: false });
        document.addEventListener('mouseup', stopDrag);
        
        // Touch events
        document.addEventListener('touchmove', touchDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('touchcancel', stopDrag);
        
        console.log('Event listeners attached for dragging');
        debugLog('Event listeners attached for dragging');
    }    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        e.stopPropagation(); // Add for Chrome compatibility
        
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;
        
        updateTransform();
    }function touchDrag(e) {
        if (!isDragging || e.touches.length !== 1) {
            debugLog(`touchDrag ignored: isDragging=${isDragging}, touches=${e.touches.length}`);
            return;
        }
        e.preventDefault();
        
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
        
        debugLog(`touchDrag: currentX=${currentX}, currentY=${currentY}`);
        updateTransform();
    }function updateTransform() {
        const elements = document.querySelectorAll('.zoomed');
        debugLog(`updateTransform: found ${elements.length} zoomed elements, currentX=${currentX}, currentY=${currentY}`);
        
        elements.forEach(element => {
            // Get the container bounds for better drag limiting
            const containerRect = element.parentElement.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            // More generous drag bounds - allow moving the 2x scaled image around
            const maxX = Math.max(100, containerRect.width * 0.3);
            const maxY = Math.max(100, containerRect.height * 0.3);
            
            const boundedX = Math.max(-maxX, Math.min(maxX, currentX));
            const boundedY = Math.max(-maxY, Math.min(maxY, currentY));
            
            const transformString = `scale(2) translate(${boundedX / 2}px, ${boundedY / 2}px)`;
            element.style.transform = transformString;
            debugLog(`Applied transform: ${transformString} (bounds: ±${maxX}, ±${maxY})`);
        });
    }    function stopDrag() {
        if (!isDragging) return;
        
        isDragging = false;
        document.querySelectorAll('.dragging').forEach(el => {
            el.classList.remove('dragging');
        });
        
        // Remove event listeners
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', touchDrag);
        document.removeEventListener('touchend', stopDrag);
        document.removeEventListener('touchcancel', stopDrag);
    }

    // Click/Touch outside to zoom out
    function handleOutsideInteraction(e) {
        const zoomedElements = document.querySelectorAll('.zoomed');
        if (zoomedElements.length > 0 && !e.target.closest('canvas, .preview-image')) {
            zoomedElements.forEach(element => {
                element.classList.remove('zoomed', 'dragging');
                element.style.transform = '';
                element.style.transformOrigin = 'center center';
            });
            currentX = 0;
            currentY = 0;
        }
    }

    document.addEventListener('click', handleOutsideInteraction);
    document.addEventListener('touchend', function(e) {
        // Only handle if it's a single touch that ended
        if (e.changedTouches.length === 1) {
            handleOutsideInteraction(e);
        }
    });

    // Setup events for existing elements
    const imagePreview = document.getElementById('imagePreview');
    const resultCanvas = document.getElementById('resultCanvas');
    
    setupImageEvents(imagePreview);
    setupImageEvents(resultCanvas);

    // Observer to setup events for dynamically created elements
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    if (node.matches('canvas, .preview-image')) {
                        setupImageEvents(node);
                    }
                    // Also check children
                    const images = node.querySelectorAll && node.querySelectorAll('canvas, .preview-image');
                    if (images) {
                        images.forEach(setupImageEvents);
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Test function to load a sample image for mobile debugging
function loadTestImage() {
    debugLog('Loading test image for mobile debugging');
    
    // Create a simple test image with canvas
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Draw a simple test pattern with better mobile-friendly design
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 400, 300);
    
    // Add a border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 400, 300);
    
    // Add text instructions
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📱 MOBILE ZOOM TEST', 200, 50);
    
    ctx.font = '16px Arial';
    ctx.fillText('👆 TAP to zoom in/out', 200, 100);
    ctx.fillText('✋ DRAG when zoomed', 200, 130);
    ctx.fillText('📍 Check debug info above', 200, 160);
    
    // Add visual elements for better testing
    ctx.fillStyle = '#dc3545';
    ctx.fillRect(50, 200, 60, 60);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('RED', 80, 235);
    
    ctx.fillStyle = '#28a745';
    ctx.fillRect(150, 200, 60, 60);
    ctx.fillStyle = 'white';
    ctx.fillText('GREEN', 180, 235);
    
    ctx.fillStyle = '#007bff';
    ctx.fillRect(250, 200, 60, 60);
    ctx.fillStyle = 'white';
    ctx.fillText('BLUE', 280, 235);
    
    // Convert to data URL and set as test image
    const dataURL = canvas.toDataURL('image/png');
    
    // Create an image element
    const img = new Image();
    img.onload = function() {
        currentImage = img;
        updateContainerSize(img);
        displayImagePreview(img);
        hideError();
        
        debugLog('Test image loaded successfully');
        
        // Auto-select a background for testing
        if (selectedBackground === 'original') {
            displayOriginalImage();
        } else {
            processImage();
        }
    };
    
    img.onerror = function() {
        debugLog('Failed to load test image');
        showError('Failed to load test image');
    };
    
    img.src = dataURL;
}
