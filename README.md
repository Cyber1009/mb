# Calligraphy Extractor - Frontend Only

A pure frontend application that extracts calligraphy from images using OpenCV.js.

## Features

- **Frontend-only**: No server required, runs entirely in the browser
- **OpenCV.js**: Uses the JavaScript version of OpenCV for image processing
- **Multiple backgrounds**: Choose from white, vertical paper, horizontal paper, or classic paper
- **Adjustable threshold**: Fine-tune the extraction sensitivity
- **Drag & drop**: Easy image upload interface
- **Download results**: Save the processed images

## Files

- `index.html` - Complete standalone application
- `background/` - Background image assets

## How to Use

1. Open `index.html` in a web browser
2. Wait for OpenCV.js to load
3. Upload an image with calligraphy
4. Choose a background
5. Adjust the threshold if needed
6. Click "Extract Calligraphy"
7. Download the result

## Deployment

This app can be deployed to any static hosting service:

- **Netlify**: Drag and drop the app folder
- **Vercel**: Connect to GitHub repo
- **GitHub Pages**: Push to gh-pages branch
- **Surge.sh**: Use command line deployment

## Algorithm

The app converts your Python OpenCV algorithm to JavaScript:

1. Convert image to grayscale
2. Apply binary threshold (inverse)
3. Remove noise with morphological opening
4. Apply black calligraphy to chosen background
5. Display and allow download

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Supported

## No Backend Required

- All processing happens in the browser
- Images never leave the user's device
- Works offline after initial load
- Zero hosting costs for static deployment
