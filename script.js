document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault(); // Prevent immediate navigation
    const href = this.getAttribute('href');
    
      // Apply fade-out effect
    document.body.classList.add('fade-out');

      // After the animation completes, navigate to the new page
    setTimeout(() => {
        window.location.href = href;
      }, 500); // 500ms matches the CSS animation time
    });
});
let originalImage = null;
let originalCanvas = document.getElementById('originalCanvas');
let editedCanvas = document.getElementById('editedCanvas');
let originalCtx = originalCanvas.getContext('2d');
let editedCtx = editedCanvas.getContext('2d');

// Set canvas dimensions
originalCanvas.width = 400;
originalCanvas.height = 300;
editedCanvas.width = 400;
editedCanvas.height = 300;

document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        
        // Hide info containers on image upload
        const container = document.querySelector('.containerinfo');
        if (container) container.style.display = 'none';

        const infookieContainer = document.querySelector('.containerinfookie');
        if (infookieContainer) infookieContainer.style.display = 'none';

        document.getElementById('translateX').value = '';
        document.getElementById('translateY').value = '';
        // Optionally reset shapeClick flag if you're using it
        shapeClickHappened = false;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Store original image for reset functionality
                originalImage = img;
                
                // Draw original image
                originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
                drawImageToFit(img, originalCanvas, originalCtx);
                
                // Copy to edited canvas
                editedCtx.clearRect(0, 0, editedCanvas.width, editedCanvas.height);
                drawImageToFit(img, editedCanvas, editedCtx);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

const container = document.querySelector('.containerinfo');
if (container) container.style.display = 'none';

const infookieContainer = document.querySelector('.containerinfookie');
if (infookieContainer) infookieContainer.style.display = 'none';

shapeClickHappened = false;


function drawImageToFit(img, canvas, ctx) {
    const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
    );
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
}

function calculateGeometricProperties() {
    const imageData = editedCtx.getImageData(0, 0, editedCanvas.width, editedCanvas.height);
    const data = imageData.data;
    
    let totalPixels = 0;
    let objectPixels = 0;
    let sumX = 0;
    let sumY = 0;
    let objectSumX = 0;
    let objectSumY = 0;

    // Analyze each pixel
    for (let y = 0; y < editedCanvas.height; y++) {
        for (let x = 0; x < editedCanvas.width; x++) {
            const i = (y * editedCanvas.width + x) * 4;
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            if (brightness > 0) {
                totalPixels++;
                sumX += x;
                sumY += y;
                
                // Consider darker pixels as object
                if (brightness < 128) {
                    objectPixels++;
                    objectSumX += x;
                    objectSumY += y;
                }
            }
        }
    }

    // Update display
    document.getElementById('imageArea').textContent = totalPixels;
    document.getElementById('objectArea').textContent = objectPixels;
    
    if (totalPixels > 0) {
        document.getElementById('imageCentroidX').textContent = Math.round(sumX / totalPixels);
        document.getElementById('imageCentroidY').textContent = Math.round(sumY / totalPixels);
    }
    
    if (objectPixels > 0) {
        document.getElementById('objectCentroidX').textContent = Math.round(objectSumX / objectPixels);
        document.getElementById('objectCentroidY').textContent = Math.round(objectSumY / objectPixels);
    }
}

// First, let's fix the duplicate resetImage function by consolidating them
function resetImage() {
    if (originalImage) {
        const container = document.querySelector('.containerinfo');
        if (container) {
            container.style.display = 'none';
        }

        const infookieContainer = document.querySelector('.containerinfookie');
        if (infookieContainer) {
            infookieContainer.style.display = 'none';
        }
        

        document.getElementById('translateX').value = '';
        document.getElementById('translateY').value = '';
        // Remove all event listeners
        editedCanvas.removeEventListener('click', handleCentroidClick);
        if (typeof handleAreaClick !== 'undefined') {
            editedCanvas.removeEventListener('click', handleAreaClick);
        }
        
        // Reset flags and arrays
        if (typeof areaClickEnabled !== 'undefined') {
            areaClickEnabled = false;
        }
        centroidPoints = [];
        
        // Clear and redraw canvas
        editedCtx.clearRect(0, 0, editedCanvas.width, editedCanvas.height);
        drawImageToFit(originalImage, editedCanvas, editedCtx);
    }
}

// Function to box the uploaded image on editedCanvas
// Function to box the uploaded image on editedCanvas
function boxObjectsimage() {
    let canvas = document.getElementById('editedCanvas');
    if (!canvas) {
        alert('Canvas not found.');
        return;
    }

    let ctx = canvas.getContext('2d');
    if (!ctx) {
        alert('Unable to get canvas context.');
        return;
    }

    // Get the image data from the canvas
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    // Find the bounding box of the non-transparent pixels
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let index = (y * canvas.width + x) * 4;
            let alpha = data[index + 3];

            if (alpha > 0) { // Non-transparent pixel
                found = true;
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (!found) {
        alert('No image detected on the canvas.');
        return;
    }

    // Draw the bounding box around the detected image with thicker lines
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 5; // Thicker border
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
} 



// Now let's add the missing translateImage function
// Add this function to handle the X&Y Coordinates button
function translateImage() {
    const container = document.querySelector('.containerinfo');
    container.style.display = 'block';
    
    if (!originalImage) return;
    
    let src = cv.imread('editedCanvas');
    let dst = new cv.Mat();
    
    // Create a mask to exclude the gray background
    let bgMask = new cv.Mat();
    let hsv = new cv.Mat();
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
    
    // Define gray background in HSV (low saturation)
    let grayLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let grayHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    grayLow.data[0] = 0;   // H
    grayLow.data[1] = 0;   // S
    grayLow.data[2] = 50;  // V
    grayHigh.data[0] = 180;
    grayHigh.data[1] = 50; // Low saturation for gray
    grayHigh.data[2] = 200;
    
    // Create mask for gray background
    cv.inRange(hsv, grayLow, grayHigh, bgMask);
    
    // Invert to get foreground (non-gray areas)
    cv.bitwise_not(bgMask, bgMask);
    
    // Find the white rectangle (actual content area)
    let whiteRect = findWhiteRectangle(src);
    
    // Create a border mask to exclude the edges
    let borderMask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
    let roiMat = null;
    
    if (whiteRect) {
        let roi = new cv.Rect(
            whiteRect.x + 2, // Add small margin
            whiteRect.y + 2,
            whiteRect.width - 4,
            whiteRect.height - 4
        );
        roiMat = borderMask.roi(roi);
        roiMat.setTo(new cv.Scalar(255));
    }
    
    // Apply the border mask to exclude the gray border
    cv.bitwise_and(bgMask, borderMask, bgMask);
    
    // Process colors with expanded ranges for better detection
    let colorMasks = [];
    let colors = [
        { name: "Red1", low: [0, 100, 100], high: [10, 255, 255] },
        { name: "Red2", low: [160, 100, 100], high: [180, 255, 255] }, // Red wraps around in HSV
        { name: "Yellow", low: [20, 100, 100], high: [40, 255, 255] },
        { name: "Green", low: [45, 100, 100], high: [75, 255, 255] },
        { name: "Blue", low: [90, 100, 100], high: [130, 255, 255] },
        { name: "Orange", low: [5, 100, 100], high: [20, 255, 255] }
    ];
    
    let combinedColorMask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
    
    for (let color of colors) {
        let colorLow = new cv.Mat(1, 3, cv.CV_8UC1);
        let colorHigh = new cv.Mat(1, 3, cv.CV_8UC1);
        
        colorLow.data[0] = color.low[0];
        colorLow.data[1] = color.low[1];
        colorLow.data[2] = color.low[2];
        
        colorHigh.data[0] = color.high[0];
        colorHigh.data[1] = color.high[1];
        colorHigh.data[2] = color.high[2];
        
        let colorMask = new cv.Mat();
        cv.inRange(hsv, colorLow, colorHigh, colorMask);
        
        // Add to combined mask
        cv.bitwise_or(combinedColorMask, colorMask, combinedColorMask);
        
        colorMasks.push({ mask: colorMask, name: color.name });
        
        colorLow.delete();
        colorHigh.delete();
    }
    
    // Apply the background and border masks
    cv.bitwise_and(combinedColorMask, bgMask, combinedColorMask);
    
    // Also process using grayscale for shapes that might not be detected by color
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    
    // Apply background mask to binary image
    cv.bitwise_and(binary, bgMask, binary);
    
    // Combine with color masks
    cv.bitwise_or(binary, combinedColorMask, binary);
    
    // Find contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    src.copyTo(dst);
    
    // Calculate image center coordinates
    let imageCenterX = Math.round(src.cols / 2);
    let imageCenterY = Math.round(src.rows / 2);
    
    // Update the input fields with image center coordinates
    document.getElementById('translateX').value = imageCenterX;
    document.getElementById('translateY').value = imageCenterY;
    
    // Draw image center
    cv.circle(dst, new cv.Point(imageCenterX, imageCenterY), 8, new cv.Scalar(255, 0, 255, 255), 2);
    cv.circle(dst, new cv.Point(imageCenterX, imageCenterY), 4, new cv.Scalar(255, 255, 0, 255), -1);
    
    // Calculate and draw object coordinates
    let objectCoordinates = [];
    
    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);
        
        if (area > 50) { // Filter out noise
            // Calculate centroid
            let moments = cv.moments(contour);
            if (moments.m00 !== 0) {
                let cx = Math.round(moments.m10 / moments.m00);
                let cy = Math.round(moments.m01 / moments.m00);
                
                objectCoordinates.push({ x: cx, y: cy });
                
                // Draw object centroid
                cv.circle(dst, new cv.Point(cx, cy), 4, new cv.Scalar(0, 0, 255, 255), -1);
                cv.circle(dst, new cv.Point(cx, cy), 6, new cv.Scalar(0, 255, 0, 255), 2);
                
                // Add coordinates text
                cv.putText(dst, 
                    `(${cx}, ${cy})`, 
                    new cv.Point(cx + 10, cy),
                    cv.FONT_HERSHEY_SIMPLEX, 
                    0.5, 
                    new cv.Scalar(0, 255, 0, 255), // Green (BGR)
                    1 // Thicker text
                );
            }
        }
        
    }
    
    // Display result
    cv.imshow('editedCanvas', dst);
    
    // Create a message with all coordinates
    let message = `Image Center: (${imageCenterX}, ${imageCenterY})\n\n`;
    
    if (objectCoordinates.length > 0) {
        message += `Total Objects Detected: ${objectCoordinates.length}\n`;
        message += "Object Coordinates:\n";
        objectCoordinates.forEach((coord, index) => {
            message += `Object ${index+1}: (${coord.x}, ${coord.y})\n`;
        });
    } else {
        message += "No objects detected.";
    }
    
    // Display message dialog
    document.getElementById('shapeCount').innerHTML = message;

    
    // Clean up
    src.delete(); dst.delete();
    hsv.delete();
    bgMask.delete();
    grayLow.delete();
    grayHigh.delete();
    borderMask.delete();
    if (roiMat) roiMat.delete();
    combinedColorMask.delete();
}


function calculateImageArea() {
    if (!originalImage) return;
    
    let src = cv.imread('editedCanvas');
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    
    // Image processing
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    
    // Calculate total area
    let totalArea = 0;
    for (let i = 0; i < binary.rows; i++) {
        for (let j = 0; j < binary.cols; j++) {
            if (binary.ucharPtr(i, j)[0] > 0) {
                totalArea++;
            }
        }
    }
    
    // Display result on image without changing the image itself
    let dst = src.clone();
    
    // Display total area text
    cv.putText(dst, 
        `Total Area: ${totalArea} pixels`, 
        new cv.Point(10, 30),
        cv.FONT_HERSHEY_SIMPLEX, 
        0.7, 
        new cv.Scalar(0, 255, 0, 255),
        2
    );
    
    cv.imshow('editedCanvas', dst);
    document.getElementById('imageArea').textContent = totalArea;
    
    // Clean up
    src.delete(); gray.delete(); binary.delete(); dst.delete();
}

function saveImage() {
    const link = document.createElement('a');
    link.download = 'processed-image.png';
    link.href = editedCanvas.toDataURL();
    link.click();
}


function onOpenCvReady() {
    // Initialize OpenCV functionality
    cv['onRuntimeInitialized'] = function() {
        console.log('OpenCV Ready');
    }
}

function boxObjects() {
    if (!originalImage) return;

    let src = cv.imread('editedCanvas');
    let dst = new cv.Mat();
    
    // Create a mask to exclude the gray background
    let bgMask = new cv.Mat();
    let hsv = new cv.Mat();
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
    
    // Define gray background in HSV (low saturation)
    let grayLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let grayHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    grayLow.data[0] = 0;   // H
    grayLow.data[1] = 0;   // S
    grayLow.data[2] = 50;  // V
    grayHigh.data[0] = 180;
    grayHigh.data[1] = 50; // Low saturation for gray
    grayHigh.data[2] = 200;
    
    // Create mask for gray background
    cv.inRange(hsv, grayLow, grayHigh, bgMask);
    
    // Invert to get foreground (non-gray areas)
    cv.bitwise_not(bgMask, bgMask);
    
    let yellowMask = new cv.Mat();
    let orangeMask = new cv.Mat();
    let combinedMask = new cv.Mat();
    
    // Yellow range
    let yellowLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let yellowHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    yellowLow.data[0] = 20;  // H
    yellowLow.data[1] = 100; // S
    yellowLow.data[2] = 100; // V
    yellowHigh.data[0] = 40;
    yellowHigh.data[1] = 255;
    yellowHigh.data[2] = 255;
    
    // Orange range
    let orangeLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let orangeHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    orangeLow.data[0] = 5;   // H
    orangeLow.data[1] = 100; // S
    orangeLow.data[2] = 100; // V
    orangeHigh.data[0] = 20;
    orangeHigh.data[1] = 255;
    orangeHigh.data[2] = 255;
    
    // Create masks for yellow and orange
    cv.inRange(hsv, yellowLow, yellowHigh, yellowMask);
    cv.inRange(hsv, orangeLow, orangeHigh, orangeMask);
    
    // Combine yellow and orange masks
    cv.add(yellowMask, orangeMask, combinedMask);
    
    // Apply the background mask to exclude gray areas
    cv.bitwise_and(combinedMask, bgMask, combinedMask);
    
    // Process other colors using grayscale
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    
    // Apply background mask to binary image
    cv.bitwise_and(binary, bgMask, binary);
    
    // Combine with color masks
    cv.bitwise_or(binary, combinedMask, binary);
    
    // Create a border mask to exclude the edges
    let borderMask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
    // Find the white area (actual image content)
    let whiteRect = findWhiteRectangle(src);
    
    // Create ROI for the white area only
    if (whiteRect) {
        let roi = new cv.Rect(
            whiteRect.x + 2, // Add small margin
            whiteRect.y + 2,
            whiteRect.width - 4,
            whiteRect.height - 4
        );
        let roiMat = borderMask.roi(roi);
        roiMat.setTo(new cv.Scalar(255));
    }
    
    // Apply the border mask to exclude the gray border
    cv.bitwise_and(binary, borderMask, binary);
    
    // Find contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    src.copyTo(dst);
    let totalObjectArea = 0;
    
    // Process each contour
    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);
        
        if (area > 50) {
            totalObjectArea += area;
            
            // Get bounding rectangle
            let rect = cv.boundingRect(contour);
            let point1 = new cv.Point(rect.x, rect.y);
            let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
            
            // Draw rectangle only
            cv.rectangle(dst, point1, point2, new cv.Scalar(255, 0, 0, 255), 2);
        }
    }
    
    // Display result
    cv.imshow('editedCanvas', dst);
    document.getElementById('objectArea').textContent = Math.round(totalObjectArea);
    
    // Clean up
    src.delete();
    dst.delete();
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
    hsv.delete();
    yellowMask.delete();
    yellowLow.delete();
    yellowHigh.delete();
    orangeMask.delete();
    orangeLow.delete();
    orangeHigh.delete();
    combinedMask.delete();
    bgMask.delete();
    grayLow.delete();
    grayHigh.delete();
    borderMask.delete();
    if (roiMat) roiMat.delete();
}

// Add this helper function to find the white rectangle (actual image content)
function findWhiteRectangle(src) {
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    
    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Threshold to find white area
    cv.threshold(gray, binary, 200, 255, cv.THRESH_BINARY);
    
    // Find contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    // Find the largest white area (should be the content area)
    let maxArea = 0;
    let maxRect = null;
    
    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);
        
        if (area > maxArea) {
            maxArea = area;
            maxRect = cv.boundingRect(contour);
        }
    }
    
    // Clean up
    gray.delete();
    binary.delete();
    contours.delete();
    hierarchy.delete();
    
    return maxRect;
}

function shapedetect() {
    const container = document.querySelector('.containerinfookie');
    container.style.display = 'block';
    if (!originalImage) return;

    let src = cv.imread('editedCanvas');
    let dst = src.clone();
    let hsv = new cv.Mat();
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    // Estimate background type
    let meanGray = cv.mean(src)[0];
    let isWhiteBg = meanGray > 127;

    // Background masking
    let bgMask = new cv.Mat();
    if (isWhiteBg) {
        let whiteLow = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 0, 200, 0]);
        let whiteHigh = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [180, 50, 255, 0]);
        cv.inRange(hsv, whiteLow, whiteHigh, bgMask);
        cv.bitwise_not(bgMask, bgMask);
        whiteLow.delete(); whiteHigh.delete();
    } else {
        let blackLow = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 0, 0, 0]);
        let blackHigh = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [180, 255, 50, 0]);
        cv.inRange(hsv, blackLow, blackHigh, bgMask);
        cv.bitwise_not(bgMask, bgMask);
        blackLow.delete(); blackHigh.delete();
    }

    // Detect yellow and orange
    let yellowMask = new cv.Mat();
    let orangeMask = new cv.Mat();
    let combinedMask = new cv.Mat();
    let yellowLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let yellowHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    yellowLow.data[0] = 20; yellowLow.data[1] = 100; yellowLow.data[2] = 100;
    yellowHigh.data[0] = 40; yellowHigh.data[1] = 255; yellowHigh.data[2] = 255;

    let orangeLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let orangeHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    orangeLow.data[0] = 5; orangeLow.data[1] = 100; orangeLow.data[2] = 100;
    orangeHigh.data[0] = 20; orangeHigh.data[1] = 255; orangeHigh.data[2] = 255;

    cv.inRange(hsv, yellowLow, yellowHigh, yellowMask);
    cv.inRange(hsv, orangeLow, orangeHigh, orangeMask);
    cv.add(yellowMask, orangeMask, combinedMask);
    cv.bitwise_and(combinedMask, bgMask, combinedMask);

    // Add fallback color mask for dark background (from boxDarkBackgroundObjects)
    let colorMask = new cv.Mat();
    if (!isWhiteBg) {
        let colorLow = new cv.Mat(1, 3, cv.CV_8UC1);
        let colorHigh = new cv.Mat(1, 3, cv.CV_8UC1);
        colorLow.data[0] = 0; colorLow.data[1] = 25; colorLow.data[2] = 25;
        colorHigh.data[0] = 180; colorHigh.data[1] = 255; colorHigh.data[2] = 255;
        cv.inRange(hsv, colorLow, colorHigh, colorMask);
        cv.bitwise_and(colorMask, bgMask, colorMask);
        cv.bitwise_or(combinedMask, colorMask, combinedMask);
        colorLow.delete(); colorHigh.delete();
    }

    // Grayscale and binary preprocessing
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);
    let thresholdType = isWhiteBg ? cv.THRESH_BINARY_INV + cv.THRESH_OTSU : cv.THRESH_BINARY + cv.THRESH_OTSU;
    cv.threshold(gray, binary, 0, 255, thresholdType);
    cv.bitwise_and(binary, bgMask, binary);
    cv.bitwise_or(binary, combinedMask, binary);

    // Contour detection
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let totalObjectArea = 0;
    let shapeCounts = {};
    let colorCounts = {};

    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);

        if (area > 50) {
            totalObjectArea += area;
            let rect = cv.boundingRect(contour);
            let point1 = new cv.Point(rect.x, rect.y);
            let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
            cv.rectangle(dst, point1, point2, new cv.Scalar(255, 0, 0, 255), 2);

            let shapeName = detectShapeName(contour);

            let centerX = rect.x + Math.floor(rect.width / 2);
            let centerY = rect.y + Math.floor(rect.height / 2);
            let pixel = hsv.ucharPtr(centerY, centerX);
            let h = pixel[0], s = pixel[1], v = pixel[2];
            let colorName = getColorNameFromHSV(h, s, v);

            shapeCounts[shapeName] = (shapeCounts[shapeName] || 0) + 1;
            colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;

            let label = `${colorName} ${shapeName}`;
            let textPos = new cv.Point(rect.x + 5, rect.y + 20);
            cv.putText(dst, label, textPos, cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(0, 0, 0, 255), 2);
            cv.putText(dst, label, textPos, cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(255, 255, 255, 255), 1);
        }
    }

    cv.imshow('editedCanvas', dst);
    document.getElementById('objectArea').textContent = Math.round(totalObjectArea);
    document.getElementById('shapeTypes').textContent = Object.keys(shapeCounts).length;
    document.getElementById('colorTypes').textContent = Object.keys(colorCounts).length;
    renderCounts(shapeCounts, 'shapeCountList');
    renderCounts(colorCounts, 'colorCountList');

    // Cleanup
    src.delete(); dst.delete(); hsv.delete(); gray.delete(); binary.delete();
    bgMask.delete(); yellowMask.delete(); orangeMask.delete(); combinedMask.delete();
    yellowLow.delete(); yellowHigh.delete(); orangeLow.delete(); orangeHigh.delete();
    contours.delete(); hierarchy.delete(); if (typeof colorMask !== 'undefined') colorMask.delete();
}


function detectShapeName(contour) {
    let approx = new cv.Mat();
    let peri = cv.arcLength(contour, true);
    cv.approxPolyDP(contour, approx, 0.04 * peri, true);
    let vertices = approx.rows;

    if (vertices === 3) {
        approx.delete();
        return "Triangle";
    }
    
    if (vertices === 4) {
        let ptsArr = [];
        for (let i = 0; i < 4; i++) {
            ptsArr.push({
                x: approx.data32S[i * 2],
                y: approx.data32S[i * 2 + 1]
            });
        }
    
        let dx = Math.abs(ptsArr[0].x - ptsArr[2].x);
        let dy = Math.abs(ptsArr[0].y - ptsArr[2].y);
        approx.delete();
    
        if (dx < 10 || dy < 10) {
            return "Diamond";
        }
    
        let rect = cv.boundingRect(contour);
        let aspectRatio = rect.width / rect.height;
        return aspectRatio >= 0.95 && aspectRatio <= 1.05 ? "Square" : "Rectangle";
    }
    
    if (vertices === 5) {
        approx.delete();
        return "Pentagon";
    }
    
    if (vertices === 6) {
        // Check if this is really a hexagon or a rounded shape like an oval
        let area = cv.contourArea(contour);
        let perimeter = cv.arcLength(contour, true);
        let circularity = 4 * Math.PI * (area / (perimeter * perimeter));
    
        if (circularity > 0.75) {
            approx.delete();
            return "Circle";  // Possibly a circle/oval approximated to 6 sides
        }
    
        approx.delete();
        return "Hexagon";
    }
    
    if (vertices > 6) {
        if (contour.rows >= 5) {
            let ellipse = cv.fitEllipse(contour);
            let aspectRatio = ellipse.size.width / ellipse.size.height;
            aspectRatio = aspectRatio < 1 ? 1 / aspectRatio : aspectRatio; // Normalize
    
            approx.delete();
    
            let contourArea = cv.contourArea(contour);
            let ellipseArea = Math.PI * (ellipse.size.width / 2) * (ellipse.size.height / 2);
            let solidity = contourArea / ellipseArea;
    
            if (solidity < 0.7) {
                return "Uncertain"; // Poor ellipse fit
            }
    
            if (aspectRatio >= 1 && aspectRatio <= 1.05) {
                return "Circle";
            } else {
                return "Oval";
            }
        } else {
            approx.delete();
            return "Uncertain"; // Not enough points for ellipse
        }
    }
    
    approx.delete();
    return "Unknown";
}

function getColorNameFromHSV(h, s, v) {
    if (v < 40 && s < 60) return "Black";
if (v > 220 && s < 30) return "White";
if (s < 40) return "Gray";

// Hue-based color ranges
if ((h >= 0 && h < 10) || (h >= 170 && h <= 180)) return "Red";
if (h >= 10 && h < 20) return "Orange";
if (h >= 20 && h < 33) return "Yellow";
if (h >= 33 && h < 85) return "Green";
if (h >= 85 && h < 100) return "Cyan";
if (h >= 100 && h < 130) return "Blue";
if (h >= 130 && h < 160) return "Purple";
if (h >= 160 && h < 170) return "Magenta";

return "Unknown";

}

// Render count summaries to the DOM
function renderCounts(counts, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (let key in counts) {
        let item = document.createElement('div');
        item.textContent = `${key}: ${counts[key]}`;
        container.appendChild(item);
    }
}



function findWhiteRectangle(src) {
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, 200, 255, cv.THRESH_BINARY);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let maxRect = null;
    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);
        if (area > maxArea) {
            maxArea = area;
            maxRect = cv.boundingRect(contour);
        }
    }

    gray.delete(); binary.delete(); contours.delete(); hierarchy.delete();
    return maxRect;
}


// Finds the white content area
function findWhiteRectangle(src) {
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, 200, 255, cv.THRESH_BINARY);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let maxRect = null;
    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);
        if (area > maxArea) {
            maxArea = area;
            maxRect = cv.boundingRect(contour);
        }
    }

    gray.delete(); binary.delete(); contours.delete(); hierarchy.delete();
    return maxRect;
}

/*
// Add this as a separate function outside of detectCentroids
function detectImageCentroid() {
    if (!originalImage) return;
    
    // Reset the canvas to the original image first
    editedCtx.clearRect(0, 0, editedCanvas.width, editedCanvas.height);
    drawImageToFit(originalImage, editedCanvas, editedCtx);
    
    // Get the center coordinates
    const centerX = editedCanvas.width / 2;
    const centerY = editedCanvas.height / 2;
    
    // Draw a prominent dot at the center
    editedCtx.beginPath();
    editedCtx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    editedCtx.fillStyle = 'magenta';
    editedCtx.fill();
    
    // Add an outer ring
    editedCtx.beginPath();
    editedCtx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    editedCtx.strokeStyle = 'yellow';
    editedCtx.lineWidth = 2;
    editedCtx.stroke();
    
    // Add text label
    editedCtx.font = '14px Arial';
    editedCtx.fillStyle = 'white';
    editedCtx.fillText(`Center (${Math.round(centerX)}, ${Math.round(centerY)})`, centerX + 15, centerY);
    
    // Update UI elements if they exist
    if (document.getElementById('imageCentroidX')) {
        document.getElementById('imageCentroidX').textContent = Math.round(centerX);
    }
    if (document.getElementById('imageCentroidY')) {
        document.getElementById('imageCentroidY').textContent = Math.round(centerY);
    }
    
    console.log(`Image center drawn at (${centerX}, ${centerY})`);
}
*/
// Add a new function to handle clicks on the image center
function handleImageCenterClick(event) {
    const rect = editedCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Get the center of the image
    const centerX = editedCanvas.width / 2;
    const centerY = editedCanvas.height / 2;
    
    // Check if click is near the center
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    if (distance < 15) { // Slightly larger tolerance for center
        // Draw a dot at the exact click location
        let src = cv.imread('editedCanvas');
        
        // Draw a highlighted center with pulsing effect
        cv.circle(src, new cv.Point(centerX, centerY), 15, new cv.Scalar(255, 0, 255, 255), 2);
        cv.circle(src, new cv.Point(centerX, centerY), 10, new cv.Scalar(255, 255, 0, 255), -1);
        
        // Add enhanced label
        cv.putText(src, 
            `Image Center: (${Math.round(centerX)}, ${Math.round(centerY)})`, 
            new cv.Point(centerX + 20, centerY),
            cv.FONT_HERSHEY_SIMPLEX, 
            0.6, 
            new cv.Scalar(255, 255, 255, 255),
            1
        );
        
        cv.imshow('editedCanvas', src);
        src.delete();
    }
}



function handleCentroidClick(event) {
    const rect = editedCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if click is near any centroid
    for (let point of centroidPoints) {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
        if (distance < 10) { // Click tolerance radius
            // Draw more visible dot on the image
            drawDotOnImage(point.x, point.y);
            
            // Add visual feedback for the click
            let src = cv.imread('editedCanvas');
            
            // Draw a pulsing circle effect
            cv.circle(src, new cv.Point(point.x, point.y), 15, new cv.Scalar(255, 0, 0, 255), 2);
            cv.circle(src, new cv.Point(point.x, point.y), 8, new cv.Scalar(0, 255, 255, 255), -1);
            
            // Add label with coordinates
            cv.putText(src, 
                `(${Math.round(point.x)}, ${Math.round(point.y)})`, 
                new cv.Point(point.x + 15, point.y),
                cv.FONT_HERSHEY_SIMPLEX, 
                0.5, 
                new cv.Scalar(255, 255, 0, 255),
                1
            );
            
            cv.imshow('editedCanvas', src);
            src.delete();
            break;
        }
    }
}

function drawDotOnImage(x, y) {
    let src = cv.imread('editedCanvas');
    
    // Draw more visible dot
    // Inner dot (filled)
    cv.circle(src, new cv.Point(x, y), 4, new cv.Scalar(0, 0, 255, 255), -1);
    // Outer ring
    cv.circle(src, new cv.Point(x, y), 6, new cv.Scalar(255, 255, 0, 255), 2);
    
    cv.imshow('editedCanvas', src);
    src.delete();
}


function calculateObjectAreas() {
    if (!originalImage) return;

    let src = cv.imread('editedCanvas');
    let dst = new cv.Mat();
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    
    // Add HSV color filtering for yellow and orange
    let hsv = new cv.Mat();
    let yellowMask = new cv.Mat();
    let orangeMask = new cv.Mat();
    let combinedMask = new cv.Mat();
    
    // Convert to HSV color space
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
    
    // Define yellow color range in HSV
    let yellowLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let yellowHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    
    // Define orange color range in HSV
    let orangeLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let orangeHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    
    // Yellow range
    yellowLow.data[0] = 20;  // H
    yellowLow.data[1] = 100; // S
    yellowLow.data[2] = 100; // V
    yellowHigh.data[0] = 40;
    yellowHigh.data[1] = 255;
    yellowHigh.data[2] = 255;
    
    // Orange range
    orangeLow.data[0] = 5;   // H
    orangeLow.data[1] = 100; // S
    orangeLow.data[2] = 100; // V
    orangeHigh.data[0] = 20;
    orangeHigh.data[1] = 255;
    orangeHigh.data[2] = 255;
    
    // Create masks for yellow and orange
    cv.inRange(hsv, yellowLow, yellowHigh, yellowMask);
    cv.inRange(hsv, orangeLow, orangeHigh, orangeMask);
    
    // Combine yellow and orange masks
    cv.add(yellowMask, orangeMask, combinedMask);
    
    // Create a mask to exclude the gray background
    let bgMask = new cv.Mat();
    
    // Define gray background in HSV (low saturation)
    let grayLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let grayHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    grayLow.data[0] = 0;   // H
    grayLow.data[1] = 0;   // S
    grayLow.data[2] = 50;  // V
    grayHigh.data[0] = 180;
    grayHigh.data[1] = 50; // Low saturation for gray
    grayHigh.data[2] = 200;
    
    // Create mask for gray background
    cv.inRange(hsv, grayLow, grayHigh, bgMask);
    
    // Invert to get foreground (non-gray areas)
    cv.bitwise_not(bgMask, bgMask);
    
    // Original grayscale processing
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    
    // Apply background mask to binary image
    cv.bitwise_and(binary, bgMask, binary);
    
    // Combine color masks with binary image
    cv.bitwise_or(binary, combinedMask, binary);
    
    // Create a border mask to exclude the edges
    let borderMask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
    // Find the white area (actual image content)
    let whiteRect = findWhiteRectangle(src);
    
    // Create ROI for the white area only
    let roiMat = null;
    if (whiteRect) {
        let roi = new cv.Rect(
            whiteRect.x + 2, // Add small margin
            whiteRect.y + 2,
            whiteRect.width - 4,
            whiteRect.height - 4
        );
        roiMat = borderMask.roi(roi);
        roiMat.setTo(new cv.Scalar(255));
    }
    
    // Apply the border mask to exclude the gray border
    cv.bitwise_and(binary, borderMask, binary);
    
    // Find contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    src.copyTo(dst);
    
    // Make sure centroidPoints is defined globally if it's not already
    if (typeof centroidPoints === 'undefined') {
        window.centroidPoints = [];
    }
    
    // Process each contour
    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);
        
        if (area > 50) { // Filter out noise
            // Get bounding rectangle
            let rect = cv.boundingRect(contour);
            
            // Draw rectangle
            let point1 = new cv.Point(rect.x, rect.y);
            let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
            cv.rectangle(dst, point1, point2, new cv.Scalar(0, 255, 0, 255), 2);
            
            // Display area for each object
            cv.putText(dst, 
                `Area: ${Math.round(area)}`, 
                new cv.Point(rect.x, rect.y + rect.height + 20),
                cv.FONT_HERSHEY_SIMPLEX, 
                0.5, 
                new cv.Scalar(255, 0, 0, 255),
                1
            );
        }
    }
    
    // Update display
    cv.imshow('editedCanvas', dst);
    
    // Clean up
    src.delete(); dst.delete(); gray.delete();
    binary.delete(); contours.delete(); hierarchy.delete();
    hsv.delete();
    yellowMask.delete();
    yellowLow.delete();
    yellowHigh.delete();
    orangeMask.delete();
    orangeLow.delete();
    orangeHigh.delete();
    combinedMask.delete();
    bgMask.delete();
    grayLow.delete();
    grayHigh.delete();
    borderMask.delete();
    if (roiMat) roiMat.delete();
}



// Add this function after calculateObjectAreas
function detectCentroids() {
    if (!originalImage) return;

    let src = cv.imread('editedCanvas');
    let dst = new cv.Mat();
    let gray = new cv.Mat();
    let binary = new cv.Mat();
    
    // Add HSV color filtering for yellow and orange
    let hsv = new cv.Mat();
    let yellowMask = new cv.Mat();
    let orangeMask = new cv.Mat();
    let combinedMask = new cv.Mat();
    
    // Convert to HSV color space
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
    
    // Define yellow color range in HSV
    let yellowLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let yellowHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    
    // Define orange color range in HSV
    let orangeLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let orangeHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    
    // Yellow range
    yellowLow.data[0] = 20;  // H
    yellowLow.data[1] = 100; // S
    yellowLow.data[2] = 100; // V
    yellowHigh.data[0] = 40;
    yellowHigh.data[1] = 255;
    yellowHigh.data[2] = 255;
    
    // Orange range
    orangeLow.data[0] = 5;   // H
    orangeLow.data[1] = 100; // S
    orangeLow.data[2] = 100; // V
    orangeHigh.data[0] = 20;
    orangeHigh.data[1] = 255;
    orangeHigh.data[2] = 255;
    
    // Create masks for yellow and orange
    cv.inRange(hsv, yellowLow, yellowHigh, yellowMask);
    cv.inRange(hsv, orangeLow, orangeHigh, orangeMask);
    
    // Combine yellow and orange masks
    cv.add(yellowMask, orangeMask, combinedMask);
    
    // Create a mask to exclude the gray background
    let bgMask = new cv.Mat();
    
    // Define gray background in HSV (low saturation)
    let grayLow = new cv.Mat(1, 3, cv.CV_8UC1);
    let grayHigh = new cv.Mat(1, 3, cv.CV_8UC1);
    grayLow.data[0] = 0;   // H
    grayLow.data[1] = 0;   // S
    grayLow.data[2] = 50;  // V
    grayHigh.data[0] = 180;
    grayHigh.data[1] = 50; // Low saturation for gray
    grayHigh.data[2] = 200;
    
    // Create mask for gray background
    cv.inRange(hsv, grayLow, grayHigh, bgMask);
    
    // Invert to get foreground (non-gray areas)
    cv.bitwise_not(bgMask, bgMask);
    
    // Original grayscale processing
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    
    // Apply background mask to binary image
    cv.bitwise_and(binary, bgMask, binary);
    
    // Combine color masks with binary image
    cv.bitwise_or(binary, combinedMask, binary);
    
    // Create a border mask to exclude the edges
    let borderMask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
    // Find the white area (actual image content)
    let whiteRect = findWhiteRectangle(src);
    
    // Create ROI for the white area only
    let roiMat = null;
    if (whiteRect) {
        let roi = new cv.Rect(
            whiteRect.x + 2, // Add small margin
            whiteRect.y + 2,
            whiteRect.width - 4,
            whiteRect.height - 4
        );
        roiMat = borderMask.roi(roi);
        roiMat.setTo(new cv.Scalar(255));
    }
    
    // Apply the border mask to exclude the gray border
    cv.bitwise_and(binary, borderMask, binary);
    
    // Find contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    src.copyTo(dst);
    
    // Make sure centroidPoints is defined globally
    if (typeof centroidPoints === 'undefined') {
        window.centroidPoints = [];
    } else {
        centroidPoints = [];
    }
    
    // Calculate and draw centroids
    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        let area = cv.contourArea(contour);
        
        if (area > 50) {
            let moments = cv.moments(contour);
            if (moments.m00 !== 0) {
                let cx = moments.m10 / moments.m00;
                let cy = moments.m01 / moments.m00;
                
                // Store centroid points
                centroidPoints.push({ x: cx, y: cy });
                
                // Draw interactive centroid
                cv.circle(dst, new cv.Point(cx, cy), 4, new cv.Scalar(255, 0, 0, 255), -1);
                cv.circle(dst, new cv.Point(cx, cy), 6, new cv.Scalar(0, 255, 0, 255), 2);
            }
        }
    }
    
    cv.imshow('editedCanvas', dst);
    
    // Clean up
    src.delete(); dst.delete(); gray.delete();
    binary.delete(); contours.delete(); hierarchy.delete();
    hsv.delete();
    yellowMask.delete();
    yellowLow.delete();
    yellowHigh.delete();
    orangeMask.delete();
    orangeLow.delete();
    orangeHigh.delete();
    combinedMask.delete();
    bgMask.delete();
    grayLow.delete();
    grayHigh.delete();
    borderMask.delete();
    if (roiMat) roiMat.delete();

    // Remove any existing listener to prevent duplicates
    editedCanvas.removeEventListener('click', handleCentroidClick);
    // Add click event listener
    editedCanvas.addEventListener('click', handleCentroidClick);
    
    console.log("Centroids detected:", centroidPoints.length);}

    function detectCentroidsImage() {
        if (!originalImage) return;
    
        let src = cv.imread('editedCanvas');
        let dst = new cv.Mat();
        src.copyTo(dst);
    
        // Convert to grayscale and threshold
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0);
    
        let binary = new cv.Mat();
        cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    
        // Find contours
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
        let font = cv.FONT_HERSHEY_SIMPLEX;
        let centroidCount = 1;
    
        for (let i = 0; i < contours.size(); i++) {
            let contour = contours.get(i);
            let area = cv.contourArea(contour);
    
            if (area > 50) { // Filter out noise
                let M = cv.moments(contour);
                if (M.m00 !== 0) {
                    let cx = Math.round(M.m10 / M.m00);
                    let cy = Math.round(M.m01 / M.m00);
    
                    // Draw centroid
                    cv.circle(dst, new cv.Point(cx, cy), 4, new cv.Scalar(255, 0, 0, 255), -1);
                    cv.putText(dst, `C${centroidCount}`, new cv.Point(cx + 5, cy - 5), font, 0.5, new cv.Scalar(255, 0, 0, 255), 1);
                    centroidCount++;
                }
            }
        }
    
        // Optional: Draw image center
        let centerX = Math.round(src.cols / 2);
        let centerY = Math.round(src.rows / 2);
        document.getElementById('translateX').value = centerX;
        document.getElementById('translateY').value = centerY;
    
        cv.circle(dst, new cv.Point(centerX, centerY), 8, new cv.Scalar(255, 0, 255, 255), 2);
        cv.circle(dst, new cv.Point(centerX, centerY), 4, new cv.Scalar(255, 255, 0, 255), -1);
    
        // Show result
        cv.imshow('editedCanvas', dst);
    
        // Cleanup
        src.delete(); dst.delete(); gray.delete(); binary.delete();
        contours.delete(); hierarchy.delete();
    }
    
    function displayCentroidImage(size, centroids, canvasId = 'centroidCanvas') {
        let blank = new cv.Mat.zeros(size.height, size.width, cv.CV_8UC4);
    
        for (let { x, y } of centroids) {
            cv.circle(blank, new cv.Point(x, y), 6, new cv.Scalar(0, 255, 0, 255), 2);
            cv.circle(blank, new cv.Point(x, y), 4, new cv.Scalar(0, 0, 255, 255), -1);
            cv.putText(blank, `(${x}, ${y})`, new cv.Point(x + 10, y),
                cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(255, 255, 255, 255), 1);
        }
    
        cv.imshow(canvasId, blank);
        blank.delete();
    }
    