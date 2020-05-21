// =================================
//      AINDA NÃO ESTÁ FUNCIONAL
// =================================

var workspace = document.getElementById('workspace');
var canvas = new fabric.Canvas('workspace', { selection: false });

var cropAreas = [];
var canvasWidth, canvasHeight;
var imageFormat = 'png';
var cropAreaWidth = 100, cropAreaHeight = 100;
var cropAreaColor = 'red';
var cropAreaOpacity = 0.4;
var selectedCropArea;

const createWorkspace = async (options) => {
    // Creating the container
    var container = document.getElementsByClassName('workspace-container')[0];

    // Creating the crop area display modal
    var displayModal = document.createElement('div');
    displayModal.setAttribute('id', 'crop-modal');
    displayModal.setAttribute('class', 'display-crop-container');

    var closeDiv = document.createElement('span');
    closeDiv.setAttribute('class', 'display-crop-container');

    var close = document.createElement('span');
    close.setAttribute('class', 'close-display material-icons');
    close.setAttribute('onclick', 'closeDisplayModal()');
    close.appendChild(document.createTextNode('close'));

    var image = document.createElement('div');
    image.setAttribute('id', 'crop-image-display');

    displayModal.appendChild(close);
    displayModal.appendChild(image);

    // Creating the workspace area
    var workspaceArea = document.createElement('div');
    workspaceArea.setAttribute('class', 'workspace-area');
    
    var workspaceDevArea = document.createElement('textarea');
    workspaceDevArea.setAttribute('id', 'dev-area');
    workspaceDevArea.setAttribute('class', 'workspace-dev-area');
    workspaceDevArea.style.width = options.width ? `${options.width}px` : '100%';

    var loading = document.createElement('div');
    loading.setAttribute('class', 'workspace-loading');

    var ellipses = document.createElement('div');
    ellipses.setAttribute('class', 'lds-ellipsis');
    ellipses.appendChild(document.createElement('div'));
    ellipses.appendChild(document.createElement('div'));
    ellipses.appendChild(document.createElement('div'));
    ellipses.appendChild(document.createElement('div'));

    loading.appendChild(ellipses);

    var workspaceCanvas = document.createElement('canvas');
    workspaceCanvas.setAttribute('id', 'workspace');

    workspaceArea.appendChild(loading);
    workspaceArea.appendChild(workspaceCanvas);

    // Creating the workspace options
    var workspaceOptions = document.createElement('div');
    workspaceOptions.setAttribute('class', 'workspace-options');

    var optionsRow = document.createElement('div');
    optionsRow.setAttribute('class', 'options-row');

    var disabledButtons = options && options.disabledButtons ? options.disabledButtons : [];

    if(disabledButtons.indexOf('add-image') < 0){
        var fileSelection = createButton('file-selection', 'btn-multicrop', 'add_a_photo', 'Carregar imagem');
        optionsRow.appendChild(fileSelection);
        
        var fileInput = document.createElement('input');
        fileInput.setAttribute('id', 'input-file-selection');
        fileInput.setAttribute('type', 'file');
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', function(e){
            loadImage(fileInput);
        });

        fileSelection.addEventListener("click", function (e) {
        if (fileInput) {
            fileInput.click();
        }
        }, false);

        optionsRow.appendChild(fileInput);
    }
    
    if(disabledButtons.indexOf('add-crop') < 0){
        optionsRow.appendChild(createButton('add-crop', 'btn-multicrop', 'crop_free', 'Adicionar recorte', 'addRectangle()'));
    }
    if(disabledButtons.indexOf('remove-crop') < 0){
        optionsRow.appendChild(createButton('remove-crop', 'btn-multicrop', 'delete', 'Remover recorte', 'removeRectangle()'));
    }
    if(disabledButtons.indexOf('crop-all') < 0){
        optionsRow.appendChild(createButton('crop', 'btn-multicrop', 'crop', 'Aplicar recorte', 'crop()'));
    }

    workspaceOptions.appendChild(optionsRow);

    // Creating the workspace results
    var workspaceResults = document.createElement('div');
    workspaceResults.setAttribute('class', 'workspace-results');

    var linkRow = document.createElement('div');
    linkRow.setAttribute('id', 'crop-links');
    linkRow.setAttribute('class', 'options-row');

    workspaceResults.appendChild(linkRow);

    // Packing the container
    container.appendChild(displayModal);
    container.appendChild(workspaceArea);
    if(options.devMode){
        container.appendChild(workspaceDevArea);
    }
    container.appendChild(workspaceOptions);
    container.appendChild(workspaceResults);

    workspace = document.getElementById('workspace');
    canvas = new fabric.Canvas('workspace', { selection: false });
}

const createButton = (id, className, iconName, text, onclickAction) => {
    var button = document.createElement('button');
    button.setAttribute('id', id);
    button.setAttribute('class', className);

    var span = document.createElement('span');
    span.setAttribute('class', 'material-icons');
    span.appendChild(document.createTextNode(iconName));

    button.appendChild(span);
    button.appendChild(document.createTextNode(text));

    if(onclickAction) {
        button.setAttribute('onclick', onclickAction);
    }

    return button;
}

const loadWorkspace = async (options) => {
    createWorkspace(options).then(() => {
        if(options){
            canvasWidth = options.width ? options.width : 1024;
            canvasHeight = options.height ? options.height : 512;

            cropAreaWidth = options.defaultCropAreaWidth ? options.defaultCropAreaWidth : 100;
            cropAreaHeight = options.defaultCropAreaHeight ? options.defaultCropAreaHeight : 100;
            
            cropAreaColor = options.cropAreaColor ? options.cropAreaColor : 'red';
            cropAreaOpacity = options.cropAreaOpacity ? options.cropAreaOpacity : 0.4;

            canvas.setWidth(canvasWidth);
            canvas.setHeight(canvasHeight);

            // Applying initial crop areas
            if(options.images) {
                var index = 0;
                for(index = 0 ; index < options.images.length ; index++){
                    var image = options.images[index];
                    var initialCropAreas = options.images[index].initialCropAreas;

                    if(initialCropAreas) {
                        initialCropAreas.map(rect => {
                            var newRect = new fabric.Rect({
                                left: rect.x,
                                top: rect.y,
                                fill: cropAreaColor,
                                width: rect.width,
                                height: rect.height,
                                opacity: cropAreaOpacity,
                                hasRotatingPoint: false
                            });

                            newRect.toObject = (function(toObject) {
                                return function() {
                                  return fabric.util.object.extend(toObject.call(this), {
                                    name: this.name,
                                    imageId: this.imageId
                                  });
                                };
                            })(newRect.toObject);

                            newRect.name = rect.name ? rect.name : 'no-name';
                            newRect.imageId = image.id;

                            newRect.on('mousedown', function(event) {
                                selectedCropArea = event.target;
                                rectLogger(selectedCropArea);
                                //console.log(event);
                            });
                        
                            newRect.on('scaled', function(event) {
                                selectedCropArea = event.target;
                                rectLogger(selectedCropArea);
                            });
        
                            newRect.on('mousemove', function(event) {
                                rectLogger(event.target);
                            });

                            cropAreas.push(newRect);

                            if(index == 0){
                                canvas.add(newRect);
                            }
                        });
                    }
                }
            }

            if(options.imageFormat){
                imageFormat = options.imageFormat;
            }
        } else {
            canvas.setWidth(1024);
            canvas.setHeight(512);
        }

        canvas.renderAll();
    });
}

function addRectangle() {
    var newRect = new fabric.Rect({
        left: 10,
        top: 10,
        fill: cropAreaColor,
        width: cropAreaWidth,
        height: cropAreaHeight,
        opacity: cropAreaOpacity,
        hasRotatingPoint: false
    });

    newRect.on('mousedown', function(event) {
        selectedCropArea = event.target;
        rectLogger(selectedCropArea);
    });

    newRect.on('scaled', function(event) {
        selectedCropArea = event.target;
        rectLogger(selectedCropArea);
    });

    newRect.on('mousemove', function(event) {
        rectLogger(event.target);
    });

    canvas.add(newRect);
    cropAreas.push(newRect);
}

function removeRectangle() {
    canvas.remove(selectedCropArea);
    cropAreas.pop(selectedCropArea);
}

var activatedImageId; // ID da imagem que está atualmente sendo visualizada
var canvasImage;
var copyCanvasImage;
var newImageDimensions;
var canvasImages = [];
var copyCanvasImages = [];

function loadImageFromBase64(image){
    fabric.util.loadImage(image.base64, function (img) {
        canvasImages.map(currentImage => {
            canvas.remove(currentImage);
        })
        
        canvasImage = new fabric.Image(img);
        newImageDimensions = getNewImageDimensions(canvasImage);
        canvasImage.set({
            left: 0,
            top: 0,
            selectable: false,
        });
        canvasImage.hasRotatingPoint = true;
        canvasImage.scaleToWidth(newImageDimensions.width);
        canvasImage.scaleToHeight(newImageDimensions.height);
        canvas.add(canvasImage);
        canvas.sendToBack(canvasImage);
        canvas.renderAll();

        copyCanvasImage = new fabric.Image(img);
        copyCanvasImage.set({
            left: 0,
            top: 0,
            selectable: false
        });
        copyCanvasImage.hasRotatingPoint = true;
        loadingAnimation(false);

        canvasImages.push({
            id: image.id,
            label: image.label,
            canvasImage: canvasImage
        });
        copyCanvasImages.push({
            id: image.id,
            label: image.label,
            copyCanvasImage: copyCanvasImage
        })
    });
}

function loadImage(input) {
    loadingAnimation(true);

    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            fabric.util.loadImage(e.target.result, function (img) {
                if(canvasImage){
                    canvas.remove(canvasImage);
                }
                canvasImage = new fabric.Image(img);
                newImageDimensions = getNewImageDimensions(canvasImage);
                canvasImage.set({
                    left: 0,
                    top: 0,
                    selectable: false,
                });
                canvasImage.hasRotatingPoint = true;
                canvasImage.scaleToWidth(newImageDimensions.width);
                canvasImage.scaleToHeight(newImageDimensions.height);
                canvas.add(canvasImage);
                canvas.sendToBack(canvasImage);
                canvas.renderAll();

                copyCanvasImage = new fabric.Image(img);
                copyCanvasImage.set({
                    left: 0,
                    top: 0,
                    selectable: false
                });
                copyCanvasImage.hasRotatingPoint = true;
                loadingAnimation(false);
            });
        };
        var base64 = reader.readAsDataURL(input.files[0]);
      }
}

function crop() {
    var results = document.getElementById('crop-links');
    results.innerHTML = '';
    var index = 1;
    cropAreas.map((rect) => {
        var rectFromOriginalImage = getRectFromOriginalImage(rect);

        rect.set({ opacity: 0 });
        canvas.add(copyCanvasImage);
        var img = canvas.toDataURL({
            format: imageFormat,
            left: rectFromOriginalImage.left,
            top: rectFromOriginalImage.top,
            width: rectFromOriginalImage.width,
            height: rectFromOriginalImage.height,
            // width: rect.getScaledWidth(),
            // height: rect.getScaledHeight()
        });
        canvas.remove(copyCanvasImage);
        addResult(img, `Recorte ${index}`);
        index += 1;
        rect.set({ opacity: 0.4 });
    });
}

// function addResult(img, text) {
//     var results = document.getElementById('crop-links');
//     var linkText = document.createTextNode(text);
//     var link = document.createElement('a');
//     link.appendChild(linkText);
//     link.setAttribute('href', img);
//     link.setAttribute('target', '_blank');
//     link.setAttribute('class', 'btn-link');
//     results.appendChild(link);
// }

function addResult(img, text) {
    var results = document.getElementById('crop-links');
    var linkText = document.createTextNode(text);
    var link = document.createElement('button');
    link.appendChild(linkText);
    link.setAttribute('data-img', img);
    link.setAttribute('class', 'btn-link');
    link.setAttribute('onclick', 'displayCrop(this)');
    results.appendChild(link);
}

function getNewImageDimensions(img) {
    var newHeight = (canvasWidth * img.height) / img.width;
    return {
        width: canvasWidth,
        height: newHeight
    };
}

function getRectFromOriginalImage(rect) {
    var newRectWidth = (copyCanvasImage.width * rect.getScaledWidth()) / newImageDimensions.width;
    var newRectHeight = (copyCanvasImage.height * rect.getScaledHeight()) / newImageDimensions.height;
    var newRectX = (copyCanvasImage.width * rect.left) / newImageDimensions.width;
    var newRectY = (copyCanvasImage.height * rect.top) / newImageDimensions.height;

    return {
        width: newRectWidth,
        height: newRectHeight,
        left: newRectX,
        top: newRectY
    };
}

function loadingAnimation(start) {
    const loading = document.getElementsByClassName('workspace-loading')[0];
    if(loading){
        loading.style.display = start ? 'flex' : 'none';
    }
}

const rectLogger = (rect) => {
    const logArea = document.getElementById('dev-area');

    if(logArea){
        const log = `{ name: "${rect.name}", x: ${rect.left}, y: ${rect.top}, width: ${rect.getScaledWidth()}, height: ${rect.getScaledHeight()} }`;
        logArea.innerText = log;
    }
}

function displayCrop(event){
    var modal = document.getElementById('crop-modal');
    var displayImage = document.getElementById('crop-image-display');
    var img = document.createElement('img');
    img.setAttribute('src', event.dataset.img);
    displayImage.innerHTML = '';
    displayImage.appendChild(img);
    modal.classList.add('opened');
}

function closeDisplayModal() {
    var modal = document.getElementById('crop-modal');
    modal.classList.remove('opened');
}