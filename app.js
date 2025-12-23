// Pixabay API Configuration
const PIXABAY_API_KEY = '53808707-d3a5937afed21a36d4afd1a2d';
const PIXABAY_BASE_URL = 'https://pixabay.com/api/';

class CollageMaker {
    constructor() {
        this.images = [];
        this.imagePositions = []; // Store positions for free move mode
        this.canvas = document.getElementById('collageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLayout = 'grid';
        this.borderWidth = 5;
        this.borderColor = '#ffffff';
        this.spacing = 10;
        this.canvasWidth = 1200;
        this.canvasHeight = 1200;
        this.searchPage = 1;
        this.searchHasMore = true;
        this.updateTimeout = null;
        this.mode = 'free'; // 'auto' or 'free'
        this.dragging = false;
        this.dragTarget = null;
        this.dragOffset = { x: 0, y: 0 };
        this.selectedImageIndex = null;
        
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.setupBottomMenu();
        this.setupCanvasInteraction();
        this.updateCanvasSize();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-icon');
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    setupBottomMenu() {
        const menuItems = document.querySelectorAll('.menu-item');
        const viewPanels = document.querySelectorAll('.view-panel');

        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const view = item.dataset.view;
                const targetPanel = document.getElementById(view + 'View');
                
                if (!targetPanel) {
                    console.error('Panel not found:', view + 'View');
                    return;
                }
                
                // Update menu items
                menuItems.forEach(m => m.classList.remove('active'));
                item.classList.add('active');
                
                // Update view panels
                viewPanels.forEach(panel => panel.classList.remove('active'));
                targetPanel.classList.add('active');
            });
        });
    }

    setupCanvasInteraction() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.handleCanvasMouseUp());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleCanvasTouchStart(e);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleCanvasTouchMove(e);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleCanvasTouchEnd(e);
        });
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        if (e.touches) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        }
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    findImageAtPosition(x, y) {
        if (this.mode !== 'free' || this.images.length === 0) return null;
        
        for (let i = this.imagePositions.length - 1; i >= 0; i--) {
            const pos = this.imagePositions[i];
            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {
                return { index: i, position: pos };
            }
        }
        return null;
    }

    handleCanvasMouseDown(e) {
        if (this.mode !== 'free') return;
        const coords = this.getCanvasCoordinates(e);
        const hit = this.findImageAtPosition(coords.x, coords.y);
        
        if (hit) {
            this.dragging = true;
            this.dragTarget = hit.index;
            this.selectedImageIndex = hit.index;
            this.dragOffset = {
                x: coords.x - hit.position.x,
                y: coords.y - hit.position.y
            };
            this.canvas.style.cursor = 'grabbing';
            this.render();
        }
    }

    handleCanvasMouseMove(e) {
        if (this.dragging && this.dragTarget !== null) {
            const coords = this.getCanvasCoordinates(e);
            const pos = this.imagePositions[this.dragTarget];
            
            pos.x = coords.x - this.dragOffset.x;
            pos.y = coords.y - this.dragOffset.y;
            
            // Keep within canvas bounds
            pos.x = Math.max(0, Math.min(pos.x, this.canvas.width - pos.width));
            pos.y = Math.max(0, Math.min(pos.y, this.canvas.height - pos.height));
            
            this.render();
        } else if (this.mode === 'free') {
            const coords = this.getCanvasCoordinates(e);
            const hit = this.findImageAtPosition(coords.x, coords.y);
            this.canvas.style.cursor = hit ? 'grab' : 'default';
        }
    }

    handleCanvasMouseUp() {
        if (this.dragging) {
            this.dragging = false;
            this.dragTarget = null;
            this.canvas.style.cursor = 'default';
        }
    }

    handleCanvasTouchStart(e) {
        if (this.mode !== 'free') return;
        const coords = this.getCanvasCoordinates(e);
        const hit = this.findImageAtPosition(coords.x, coords.y);
        
        if (hit) {
            this.dragging = true;
            this.dragTarget = hit.index;
            this.selectedImageIndex = hit.index;
            this.dragOffset = {
                x: coords.x - hit.position.x,
                y: coords.y - hit.position.y
            };
            this.render();
        }
    }

    handleCanvasTouchMove(e) {
        if (this.dragging && this.dragTarget !== null) {
            const coords = this.getCanvasCoordinates(e);
            const pos = this.imagePositions[this.dragTarget];
            
            pos.x = coords.x - this.dragOffset.x;
            pos.y = coords.y - this.dragOffset.y;
            
            pos.x = Math.max(0, Math.min(pos.x, this.canvas.width - pos.width));
            pos.y = Math.max(0, Math.min(pos.y, this.canvas.height - pos.height));
            
            this.render();
        }
    }

    handleCanvasTouchEnd() {
        if (this.dragging) {
            this.dragging = false;
            this.dragTarget = null;
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Mode toggle
        document.getElementById('autoModeBtn').addEventListener('click', () => this.setMode('auto'));
        document.getElementById('freeModeBtn').addEventListener('click', () => this.setMode('free'));

        // File uploads
        document.getElementById('fileUploadBtn').addEventListener('click', () => {
            document.getElementById('fileUpload').click();
        });
        document.getElementById('fileUpload').addEventListener('change', (e) => this.handleFileSelect(e));
        
        document.getElementById('iCloudUploadBtn').addEventListener('click', () => {
            document.getElementById('iCloudUpload').click();
        });
        document.getElementById('iCloudUpload').addEventListener('change', (e) => this.handleFileSelect(e));

        // Search
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Real-time controls
        document.getElementById('layoutSelect').addEventListener('change', (e) => {
            this.currentLayout = e.target.value;
            if (this.mode === 'auto') {
                this.debouncedUpdate();
            }
        });
        
        document.getElementById('borderWidth').addEventListener('input', (e) => {
            this.borderWidth = parseInt(e.target.value);
            document.getElementById('borderWidthValue').textContent = this.borderWidth + 'px';
            this.debouncedUpdate();
        });
        
        document.getElementById('borderColor').addEventListener('change', (e) => {
            this.borderColor = e.target.value;
            this.debouncedUpdate();
        });
        
        document.getElementById('spacing').addEventListener('input', (e) => {
            this.spacing = parseInt(e.target.value);
            document.getElementById('spacingValue').textContent = this.spacing + 'px';
            if (this.mode === 'auto') {
                this.debouncedUpdate();
            }
        });
        
        document.getElementById('canvasWidth').addEventListener('change', (e) => {
            this.canvasWidth = parseInt(e.target.value);
            this.updateCanvasSize();
            this.debouncedUpdate();
        });
        
        document.getElementById('canvasHeight').addEventListener('change', (e) => {
            this.canvasHeight = parseInt(e.target.value);
            this.updateCanvasSize();
            this.debouncedUpdate();
        });

        // Buttons
        document.getElementById('randomizeBtn').addEventListener('click', () => {
            if (this.mode === 'auto') {
                this.currentLayout = 'random';
                document.getElementById('layoutSelect').value = 'random';
                this.generateCollage();
            } else {
                this.randomizeFreeMode();
            }
        });
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadCollage());

        // Drag and drop
        const canvasWrapper = document.getElementById('canvasWrapper');
        const dropZone = document.getElementById('dropZone');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            canvasWrapper.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            canvasWrapper.addEventListener(eventName, () => {
                dropZone.classList.add('active', 'drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            canvasWrapper.addEventListener(eventName, () => {
                dropZone.classList.remove('active', 'drag-over');
            }, false);
        });
        
        canvasWrapper.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    setMode(mode) {
        this.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode + 'ModeBtn').classList.add('active');
        
        if (mode === 'auto') {
            this.generateCollage();
        } else {
            this.initializeFreeMode();
        }
    }

    initializeFreeMode() {
        if (this.images.length === 0) return;
        
        // Initialize positions if not set
        if (this.imagePositions.length !== this.images.length) {
            this.imagePositions = [];
            const cols = Math.ceil(Math.sqrt(this.images.length));
            const cellWidth = (this.canvas.width - (cols + 1) * this.spacing) / cols;
            
            this.images.forEach((imgData, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const aspectRatio = imgData.width / imgData.height;
                const width = cellWidth;
                const height = cellWidth / aspectRatio;
                
                this.imagePositions.push({
                    x: col * (cellWidth + this.spacing) + this.spacing,
                    y: row * (cellWidth + this.spacing) + this.spacing,
                    width: width,
                    height: height
                });
            });
        }
        
        this.render();
    }

    randomizeFreeMode() {
        if (this.images.length === 0) return;
        
        const minSize = 150;
        const maxSize = 300;
        const positions = [];
        
        this.images.forEach((imgData, index) => {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const size = Math.random() * (maxSize - minSize) + minSize;
                const aspectRatio = imgData.width / imgData.height;
                const width = aspectRatio > 1 ? size : size * aspectRatio;
                const height = aspectRatio > 1 ? size / aspectRatio : size;
                
                const x = Math.random() * (this.canvas.width - width);
                const y = Math.random() * (this.canvas.height - height);
                
                const collides = positions.some(pos => {
                    return !(x + width < pos.x || x > pos.x + pos.width ||
                            y + height < pos.y || y > pos.y + pos.height);
                });
                
                if (!collides && x + width <= this.canvas.width && y + height <= this.canvas.height) {
                    positions.push({ x, y, width, height });
                    placed = true;
                }
                attempts++;
            }
        });
        
        this.imagePositions = positions;
        this.render();
    }

    debouncedUpdate() {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            if (this.mode === 'auto' && this.images.length > 0) {
                this.generateCollage();
            } else if (this.mode === 'free') {
                this.render();
            }
        }, 300);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) {
            document.getElementById('searchResults').innerHTML = '<p class="hint">Enter a search term to find images</p>';
            return;
        }

        this.showLoading();
        this.searchPage = 1;
        this.searchHasMore = true;

        try {
            const data = await this.searchPixabay(query, 1);
            this.displaySearchResults(data.hits);
            this.searchHasMore = data.hits.length > 0 && data.totalHits > 20;
        } catch (error) {
            console.error('Search error:', error);
            document.getElementById('searchResults').innerHTML = '<p class="hint" style="color: var(--danger);">Error searching images. Please try again.</p>';
        } finally {
            this.hideLoading();
        }
    }

    async searchPixabay(query, page = 1) {
        const url = `${PIXABAY_BASE_URL}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=20&page=${page}&safesearch=true`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    displaySearchResults(images) {
        const container = document.getElementById('searchResults');
        
        if (images.length === 0) {
            container.innerHTML = '<p class="hint">No images found. Try a different search term.</p>';
            return;
        }

        container.innerHTML = images.map((image, index) => `
            <div class="search-result-item" data-url="${image.webformatURL}" data-preview="${image.previewURL}">
                <img src="${image.previewURL}" alt="${image.tags}" loading="lazy">
                <div class="add-overlay">
                    <span style="color: white; font-weight: 600;">+ Add</span>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                this.addImageFromUrl(item.dataset.url);
            });
        });

        this.setupInfiniteScroll(container);
    }

    setupInfiniteScroll(container) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.searchHasMore && !this.isLoading) {
                    this.loadMoreSearchResults();
                }
            });
        }, { threshold: 0.1 });

        const lastItem = container.lastElementChild;
        if (lastItem) {
            observer.observe(lastItem);
        }
    }

    async loadMoreSearchResults() {
        if (this.isLoading || !this.searchHasMore) return;
        
        this.isLoading = true;
        const query = document.getElementById('searchInput').value.trim();
        this.searchPage++;

        try {
            const data = await this.searchPixabay(query, this.searchPage);
            const container = document.getElementById('searchResults');
            const newItems = data.hits.map((image) => `
                <div class="search-result-item" data-url="${image.webformatURL}" data-preview="${image.previewURL}">
                    <img src="${image.previewURL}" alt="${image.tags}" loading="lazy">
                    <div class="add-overlay">
                        <span style="color: white; font-weight: 600;">+ Add</span>
                    </div>
                </div>
            `).join('');
            
            container.insertAdjacentHTML('beforeend', newItems);
            
            container.querySelectorAll('.search-result-item').forEach(item => {
                if (!item.dataset.listenerAttached) {
                    item.dataset.listenerAttached = 'true';
                    item.addEventListener('click', () => {
                        this.addImageFromUrl(item.dataset.url);
                    });
                }
            });

            this.searchHasMore = data.hits.length > 0 && (this.searchPage * 20 < data.totalHits);
        } catch (error) {
            console.error('Load more error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async addImageFromUrl(url) {
        this.showLoading();
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            });

            this.images.push({
                element: img,
                width: img.width,
                height: img.height,
                source: 'pixabay'
            });
            
            this.updateImageList();
            if (this.mode === 'free') {
                this.addImageToFreeMode(img);
            } else {
                this.generateCollage();
            }
        } catch (error) {
            console.error('Error loading image:', error);
            alert('Failed to load image. Please try another one.');
        } finally {
            this.hideLoading();
        }
    }

    addImageToFreeMode(img) {
        const aspectRatio = img.width / img.height;
        const size = 200;
        const width = aspectRatio > 1 ? size : size * aspectRatio;
        const height = aspectRatio > 1 ? size / aspectRatio : size;
        
        const x = Math.random() * (this.canvas.width - width);
        const y = Math.random() * (this.canvas.height - height);
        
        this.imagePositions.push({
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: width,
            height: height
        });
        
        this.render();
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.loadImages(files);
    }

    handleDrop(e) {
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        this.loadImages(files);
    }

    loadImages(files) {
        this.showLoading();
        let loaded = 0;
        const total = files.length;

        if (total === 0) {
            this.hideLoading();
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.images.push({
                        element: img,
                        file: file,
                        width: img.width,
                        height: img.height,
                        source: 'upload'
                    });
                    loaded++;
                    
                    if (this.mode === 'free') {
                        this.addImageToFreeMode(img);
                    }
                    
                    if (loaded === total) {
                        this.updateImageList();
                        if (this.mode !== 'free') {
                            this.generateCollage();
                        } else {
                            this.render();
                        }
                        this.hideLoading();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    updateImageList() {
        const container = document.getElementById('imageThumbnails');
        const count = document.getElementById('imageCount');
        count.textContent = this.images.length;
        
        container.innerHTML = '';
        this.images.forEach((imgData, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            thumbnail.innerHTML = `
                <img src="${imgData.element.src}" alt="Image ${index + 1}">
                <button class="remove-btn" data-index="${index}">×</button>
            `;
            thumbnail.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeImage(index);
            });
            container.appendChild(thumbnail);
        });
    }

    removeImage(index) {
        this.images.splice(index, 1);
        this.imagePositions.splice(index, 1);
        this.updateImageList();
        if (this.images.length > 0) {
            if (this.mode === 'free') {
                this.render();
            } else {
                this.generateCollage();
            }
        } else {
            this.clearCanvas();
        }
    }

    updateCanvasSize() {
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        if (this.mode === 'free') {
            this.render();
        }
    }

    render() {
        this.clearCanvas();
        
        if (this.images.length === 0) return;
        
        if (this.mode === 'free') {
            this.renderFreeMode();
        } else {
            this.generateCollage();
        }
        
        document.getElementById('downloadBtn').disabled = false;
    }

    renderFreeMode() {
        this.images.forEach((imgData, index) => {
            if (this.imagePositions[index]) {
                const pos = this.imagePositions[index];
                this.drawImage(imgData, pos.x, pos.y, pos.width, pos.height);
            }
        });
    }

    generateCollage() {
        if (this.images.length === 0) {
            return;
        }

        this.clearCanvas();
        
        switch (this.currentLayout) {
            case 'grid':
                this.generateGridLayout();
                break;
            case 'random':
                this.generateRandomLayout();
                break;
            case 'masonry':
                this.generateMasonryLayout();
                break;
            case 'spiral':
                this.generateSpiralLayout();
                break;
        }
        
        document.getElementById('downloadBtn').disabled = false;
    }

    clearCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    generateGridLayout() {
        const cols = Math.ceil(Math.sqrt(this.images.length));
        const rows = Math.ceil(this.images.length / cols);
        const cellWidth = (this.canvas.width - (cols + 1) * this.spacing) / cols;
        const cellHeight = (this.canvas.height - (rows + 1) * this.spacing) / rows;

        this.images.forEach((imgData, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            // Preserve aspect ratio
            const aspectRatio = imgData.width / imgData.height;
            let width = cellWidth;
            let height = cellHeight;
            
            if (aspectRatio > 1) {
                height = cellWidth / aspectRatio;
            } else {
                width = cellHeight * aspectRatio;
            }
            
            const x = col * (cellWidth + this.spacing) + this.spacing + (cellWidth - width) / 2;
            const y = row * (cellHeight + this.spacing) + this.spacing + (cellHeight - height) / 2;
            
            this.drawImage(imgData, x, y, width, height);
        });
    }

    generateRandomLayout() {
        const positions = [];
        const minSize = 150;
        const maxSize = 300;
        
        const shuffled = [...this.images].sort(() => Math.random() - 0.5);
        
        shuffled.forEach((imgData, index) => {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const size = Math.random() * (maxSize - minSize) + minSize;
                const aspectRatio = imgData.width / imgData.height;
                const width = aspectRatio > 1 ? size : size * aspectRatio;
                const height = aspectRatio > 1 ? size / aspectRatio : size;
                
                const x = Math.random() * (this.canvas.width - width);
                const y = Math.random() * (this.canvas.height - height);
                
                const collides = positions.some(pos => {
                    return !(x + width < pos.x || x > pos.x + pos.width ||
                            y + height < pos.y || y > pos.y + pos.height);
                });
                
                if (!collides && x + width <= this.canvas.width && y + height <= this.canvas.height) {
                    positions.push({ x, y, width, height });
                    this.drawImage(imgData, x, y, width, height);
                    placed = true;
                }
                attempts++;
            }
        });
    }

    generateMasonryLayout() {
        const cols = 3;
        const colHeights = new Array(cols).fill(this.spacing);
        const colWidth = (this.canvas.width - (cols + 1) * this.spacing) / cols;
        
        this.images.forEach((imgData) => {
            const aspectRatio = imgData.width / imgData.height;
            const height = colWidth / aspectRatio;
            const col = colHeights.indexOf(Math.min(...colHeights));
            const x = col * (colWidth + this.spacing) + this.spacing;
            const y = colHeights[col];
            
            this.drawImage(imgData, x, y, colWidth, height);
            colHeights[col] += height + this.spacing;
        });
    }

    generateSpiralLayout() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const angleStep = (Math.PI * 2) / this.images.length;
        const radiusStep = 50;
        const baseSize = 200;
        
        this.images.forEach((imgData, index) => {
            const angle = index * angleStep;
            const radius = index * radiusStep;
            const aspectRatio = imgData.width / imgData.height;
            const width = aspectRatio > 1 ? baseSize : baseSize * aspectRatio;
            const height = aspectRatio > 1 ? baseSize / aspectRatio : baseSize;
            
            const x = centerX + Math.cos(angle) * radius - width / 2;
            const y = centerY + Math.sin(angle) * radius - height / 2;
            
            const finalX = Math.max(this.spacing, Math.min(x, this.canvas.width - width - this.spacing));
            const finalY = Math.max(this.spacing, Math.min(y, this.canvas.height - height - this.spacing));
            
            this.drawImage(imgData, finalX, finalY, width, height);
        });
    }

    drawImage(imgData, x, y, width, height) {
        if (this.borderWidth > 0) {
            this.ctx.fillStyle = this.borderColor;
            this.ctx.fillRect(
                x - this.borderWidth,
                y - this.borderWidth,
                width + this.borderWidth * 2,
                height + this.borderWidth * 2
            );
        }
        
        this.ctx.drawImage(imgData.element, x, y, width, height);
    }

    downloadCollage() {
        const link = document.createElement('a');
        link.download = `collage-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    clearAll() {
        this.images = [];
        this.imagePositions = [];
        this.updateImageList();
        this.clearCanvas();
        document.getElementById('downloadBtn').disabled = true;
        document.getElementById('fileUpload').value = '';
        document.getElementById('iCloudUpload').value = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '<p class="hint">Search for images to add</p>';
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CollageMaker();
});