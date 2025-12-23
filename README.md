# Photo Collage Maker

A lightweight, standalone web application for creating beautiful photo collages from your images. No build process required - just open `index.html` in your browser!

## Features

- 📸 **Multiple Image Upload** - Upload multiple images at once
- 🎨 **Multiple Layout Styles**:
  - Grid Layout - Organized grid arrangement
  - Random Layout - Random placement with collision detection
  - Masonry Layout - Pinterest-style staggered layout
  - Spiral Layout - Artistic spiral arrangement
- 🎛️ **Customizable Controls**:
  - Adjustable border width and color
  - Spacing control between images
  - Custom canvas dimensions
- 💾 **Download** - Save your collage as a high-resolution PNG
- 🖱️ **Drag & Drop** - Easy image upload via drag and drop
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Usage

### Option 1: Using Local Server (Recommended)

1. **Start the server**:
   ```bash
   npm start
   ```
   Or if you don't have npm:
   ```bash
   node server.js
   ```

2. **Open in browser**: Navigate to `http://localhost:3004`

3. **Stop the server**: Press `Ctrl+C` in the terminal

### Option 2: Direct File Access

1. **Open the app**: Simply open `index.html` in any modern web browser
2. **Upload images**: 
   - Click "Upload Images" and select multiple images
   - Or drag and drop images onto the canvas area
3. **Customize**:
   - Choose a layout style
   - Adjust border width, color, and spacing
   - Set canvas dimensions
4. **Generate**: Click "Generate Collage" or it will auto-generate after upload
5. **Download**: Click "Download Collage" to save your creation

## Layout Styles

### Grid Layout
Organizes images in a neat grid pattern, perfect for organized collages.

### Random Layout
Places images randomly across the canvas with collision detection to prevent overlap. Great for artistic, dynamic collages.

### Masonry Layout
Creates a Pinterest-style staggered layout where images flow naturally in columns.

### Spiral Layout
Arranges images in a spiral pattern from the center, creating an artistic, flowing design.

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- File API
- Drag and Drop API
- ES6 JavaScript

## Technologies Used

- Pure HTML5
- CSS3 (with modern features like Flexbox and Grid)
- Vanilla JavaScript (ES6+)
- HTML5 Canvas API
- Node.js (for local development server)

## File Structure

```
CollageMaker/
├── index.html      # Main HTML file
├── styles.css      # Styling
├── app.js          # Application logic
├── server.js       # Local development server
├── package.json    # Node.js configuration
└── README.md       # This file
```

## License

Free to use and modify for personal or commercial projects.

## Credits

Inspired by:
- [Image-Collage-](https://github.com/gvrv03/Image-Collage-) by gvrv03
- [PhotoCollage](https://github.com/adrienverge/PhotoCollage) by adrienverge
