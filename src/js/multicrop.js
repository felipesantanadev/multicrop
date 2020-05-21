var workspace = document.getElementById('workspace');
var canvas = new fabric.Canvas('workspace', { selection: false });

var cropAreas = [];
var canvasWidth, canvasHeight;
var imageFormat = 'png';
var cropAreaWidth = 100, cropAreaHeight = 100;
var cropAreaColor = 'red';
var cropAreaOpacity = 0.4;
var selectedCropArea;
var isFrontSelected = true, isFrontAndBack = false;
var canvasImageFront, canvasImageBack, copyCanvasImageFront, copyCanvasImageBack;
var croppedImages = [];
var displayCropResults = true;

function MultiCrop () {

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
        optionsRow.setAttribute('id', 'workspace-options');
        optionsRow.setAttribute('class', 'options-row');

        var disableButtons = options && options.disableButtons ? options.disableButtons : [];

        if(disableButtons.indexOf('add-image') < 0){
            var fileSelection = this.createButton('file-selection', 'btn-multicrop', 'add_a_photo', 'Carregar imagem');
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
        
        if(disableButtons.indexOf('add-crop') < 0){
            optionsRow.appendChild(this.createButton('add-crop', 'btn-multicrop', 'crop_free', 'Adicionar recorte', 'addRectangle()'));
        }
        if(disableButtons.indexOf('remove-crop') < 0){
            optionsRow.appendChild(this.createButton('remove-crop', 'btn-multicrop', 'delete', 'Remover recorte', 'removeRectangle()'));
        }
        if(disableButtons.indexOf('crop-all') < 0){
            optionsRow.appendChild(this.createButton('crop', 'btn-multicrop', 'crop', 'Aplicar recorte', 'crop()'));
        }

        workspaceOptions.appendChild(optionsRow);

        // Creating the workspace results
        var workspaceResults = document.createElement('div');
        workspaceResults.setAttribute('class', 'workspace-results');

        var linkRow = document.createElement('div');
        linkRow.setAttribute('id', 'crop-links');
        linkRow.setAttribute('class', 'options-row');

        workspaceResults.appendChild(linkRow);

        // Creating the switch Front and Back option
        var swtichRow = document.createElement('div');
        swtichRow.setAttribute('class', 'options-row');

        var textFront = document.createTextNode('Frente');
        var buttonFront = document.createElement('button');
        buttonFront.appendChild(textFront);
        buttonFront.setAttribute('class', 'btn-front btn-switched');
        buttonFront.addEventListener("click", function (e) {
            const buttonBack = document.getElementsByClassName('btn-back')[0];
            if(buttonBack){
                buttonBack.classList.remove('btn-switched');
            }
            e.target.classList.add('btn-switched');

            isFrontSelected = true;
            switchCropAreas();
            switchImages();
        }, false);

        var textBack = document.createTextNode('Verso');
        var buttonBack = document.createElement('button');
        buttonBack.appendChild(textBack);
        buttonBack.setAttribute('class', 'btn-back');
        buttonBack.addEventListener("click", function (e) {
            const buttonFront = document.getElementsByClassName('btn-front')[0];
            if(buttonFront){
                buttonFront.classList.remove('btn-switched');
            }
            e.target.classList.add('btn-switched');

            isFrontSelected = false;
            switchCropAreas();
            switchImages();
        }, false);

        swtichRow.appendChild(buttonFront);
        swtichRow.appendChild(buttonBack);

        // Packing the container
        container.appendChild(displayModal);
        container.appendChild(workspaceArea);
        if(options.devMode){
            container.appendChild(workspaceDevArea);
        }
        if(options.isFrontAndBack){
            container.appendChild(swtichRow);
        }
        container.appendChild(workspaceOptions);

        if(options.displayCropResults) {
            container.appendChild(workspaceResults);
        }

        workspace = document.getElementById('workspace');
        canvas = new fabric.Canvas('workspace', { selection: false });
    }

    this.loadWorkspace = async (options) => {
        createWorkspace(options).then(() => {
            if(options){
                canvasWidth = options.width ? options.width : 1024;
                canvasHeight = options.height ? options.height : 512;

                cropAreaWidth = options.defaultCropAreaWidth ? options.defaultCropAreaWidth : 100;
                cropAreaHeight = options.defaultCropAreaHeight ? options.defaultCropAreaHeight : 100;
                
                cropAreaColor = options.cropAreaColor ? options.cropAreaColor : 'red';
                cropAreaOpacity = options.cropAreaOpacity ? options.cropAreaOpacity : 0.4;
                
                if(options.isFrontAndBack != undefined) {
                    isFrontAndBack = options.isFrontAndBack;
                }

                canvas.setWidth(canvasWidth);
                canvas.setHeight(canvasHeight);

                if(options.displayCropResults != undefined){
                    displayCropResults = options.displayCropResults;
                }

                // Applying initial crop areas
                if(options.initialCropAreas) {
                    options.initialCropAreas.map(rect => {

                        var newRect = new fabric.Rect({
                            left: rect.x,
                            top: rect.y,
                            fill: cropAreaColor,
                            width: rect.width,
                            height: rect.height,
                            opacity: cropAreaOpacity,
                            hasRotatingPoint: false,
                            selectable: true
                        });

                        newRect.toObject = (function(toObject) {
                            return function() {
                            return fabric.util.object.extend(toObject.call(this), {
                                name: this.name,
                                isFront: this.isFront,
                                originalOpacity: this.originalOpacity
                            });
                            };
                        })(newRect.toObject);
                    
                        newRect.name = rect.name ? rect.name : 'no-name';
                        if(!isFrontAndBack) {
                            newRect.isFront = true;
                        } else {
                            newRect.isFront = rect.isFront;
                        }
                        newRect.originalOpacity = cropAreaOpacity;

                        if(!newRect.isFront) {
                            newRect.opacity = 0;
                            newRect.selectable = false;
                        }

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
                    
                        canvas.add(newRect);
                        cropAreas.push(newRect);
                    });
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

    this.loadImageBase64 = function (imgBase64, isFront) {
        loadingAnimation(true);

        fabric.util.loadImage(imgBase64, function (img) {
            object = new fabric.Image(img);
            newImageDimensions = getNewImageDimensions(object);
            object.set({
                left: 0,
                top: 0,
                selectable: false,
            });
            object.hasRotatingPoint = true;
            object.scaleToWidth(newImageDimensions.width);
            object.scaleToHeight(newImageDimensions.height);

            object.toObject = (function(toObject) {
                return function() {
                return fabric.util.object.extend(toObject.call(this), {
                    isFront: this.isFront
                });
                };
            })(object.toObject);

            object.isFront = isFront;

            copyObject = new fabric.Image(img);
            copyObject.set({
                left: 0,
                top: 0,
                selectable: false
            });
            copyObject.hasRotatingPoint = true;

            copyObject.toObject = (function(toObject) {
                return function() {
                return fabric.util.object.extend(toObject.call(this), {
                    isFront: this.isFront
                });
                };
            })(copyObject.toObject);

            copyObject.isFront = isFront;

            if(object.isFront){
                canvasImageFront = object;
            }
            else {
                canvasImageBack = object;
            }

            if(copyObject.isFront){
                copyCanvasImageFront = copyObject;
            }
            else {
                copyCanvasImageBack = copyObject;
            }

            loadingAnimation(false);
        });
    }

    this.createButton = function (id, className, iconName, text, onclickAction) {
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

    this.addButton = function (id, className, iconName, text, onclickAction) {
        var options = document.getElementById('workspace-options');
        var button = document.createElement('button');
        button.setAttribute('id', id);
        button.setAttribute('class', className);

        var span = document.createElement('span');
        span.setAttribute('class', 'material-icons');
        span.appendChild(document.createTextNode(iconName));

        button.appendChild(span);
        button.appendChild(document.createTextNode(text));

        if(onclickAction) {
            button.addEventListener('click', onclickAction);
        }

        options.insertBefore(button, options.firstChild);
    }

    this.getCroppedImages = function () {
        return croppedImages;
    }
}

    const addRectangle = () => {
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
        var index = cropAreas.findIndex(x => x === selectedCropArea);
        if(index >= 0) {
            cropAreas.splice(index, 1);
        }
    }

    function removeAllImagesFromCanvas() {
        if(canvasImageFront){
            canvas.remove(canvasImageFront);
        }
        if(canvasImageBack){
            canvas.remove(canvasImageBack);
        }
    }

    var object;
    var copyObject;
    var newImageDimensions;

    function loadImage(input) {
        loadingAnimation(true);

        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                fabric.util.loadImage(e.target.result, function (img) {
                    object = new fabric.Image(img);
                    newImageDimensions = getNewImageDimensions(object);
                    object.set({
                        left: 0,
                        top: 0,
                        selectable: false,
                    });
                    object.hasRotatingPoint = true;
                    object.scaleToWidth(newImageDimensions.width);
                    object.scaleToHeight(newImageDimensions.height);

                    object.toObject = (function(toObject) {
                        return function() {
                        return fabric.util.object.extend(toObject.call(this), {
                            isFront: this.isFront
                        });
                        };
                    })(object.toObject);

                    object.isFront = isFrontSelected;

                    copyObject = new fabric.Image(img);
                    copyObject.set({
                        left: 0,
                        top: 0,
                        selectable: false
                    });
                    copyObject.hasRotatingPoint = true;

                    copyObject.toObject = (function(toObject) {
                        return function() {
                        return fabric.util.object.extend(toObject.call(this), {
                            isFront: this.isFront
                        });
                        };
                    })(copyObject.toObject);

                    copyObject.isFront = isFrontSelected;

                    if(object.isFront){
                        canvasImageFront = object;
                    }
                    else {
                        canvasImageBack = object;
                    }

                    if(copyObject.isFront){
                        copyCanvasImageFront = copyObject;
                    }
                    else {
                        copyCanvasImageBack = copyObject;
                    }

                    switchImages();
                    loadingAnimation(false);
                });
            };
            var base64 = reader.readAsDataURL(input.files[0]);
        }
    }

    function crop () {
        croppedImages = [];
        var results = document.getElementById('crop-links');
        if(results){
            results.innerHTML = '';
        }

        var index = 1;
        cropAreas.map((rect) => {
            if((rect.isFront && copyCanvasImageFront) || (!rect.isFront && copyCanvasImageBack))
            {
                var rectFromOriginalImage = getRectFromOriginalImage(rect);

                if(rect.isFront == isFrontSelected){
                    rect.set({ opacity: 0 });
                }
                
                canvas.add(rect.isFront ? copyCanvasImageFront : copyCanvasImageBack);
                var img = canvas.toDataURL({
                    format: imageFormat,
                    left: rectFromOriginalImage.left,
                    top: rectFromOriginalImage.top,
                    width: rectFromOriginalImage.width,
                    height: rectFromOriginalImage.height,
                    // width: rect.getScaledWidth(),
                    // height: rect.getScaledHeight()
                });
                canvas.remove(rect.isFront ? copyCanvasImageFront : copyCanvasImageBack);
                addResult(img, rect.name ? rect.name : `Recorte ${index}`);
                index += 1;
                if(rect.isFront == isFrontSelected){
                    rect.set({ opacity: 0.4 });   
                }
            }
        });
    }

    function addResult(img, name) {
        if(displayCropResults){
            var results = document.getElementById('crop-links');
            var linkText = document.createTextNode(name);
            var link = document.createElement('button');
            link.appendChild(linkText);
            link.setAttribute('data-img', img);
            link.setAttribute('class', 'btn-link');
            link.setAttribute('onclick', 'displayCrop(this)');
            results.appendChild(link);
        }
        croppedImages.push({
            name: name,
            base64: img
        });
    }

    function getNewImageDimensions(img) {
        var newHeight = (canvasWidth * img.height) / img.width;
        return {
            width: canvasWidth,
            height: newHeight
        };
    }

    function getRectFromOriginalImage(rect) {
        var newRectWidth = (copyObject.width * rect.getScaledWidth()) / newImageDimensions.width;
        var newRectHeight = (copyObject.height * rect.getScaledHeight()) / newImageDimensions.height;
        var newRectX = (copyObject.width * rect.left) / newImageDimensions.width;
        var newRectY = (copyObject.height * rect.top) / newImageDimensions.height;

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
            const log = `{ isFront: ${isFrontSelected}, name: "${rect.name}", x: ${rect.left}, y: ${rect.top}, width: ${rect.getScaledWidth()}, height: ${rect.getScaledHeight()} }`;
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

    const switchCropAreas = () => {
        cropAreas.map(rect => {
            if(rect.isFront == isFrontSelected){
                rect.opacity = rect.originalOpacity;
                rect.selectable = true;
            } else {
                rect.opacity = 0;
                rect.selectable = false;
            }
        });

        canvas.discardActiveObject().renderAll();
    }

    const switchImages = () => {
        removeAllImagesFromCanvas();

        if(isFrontSelected && canvasImageFront) {
            canvas.add(canvasImageFront);
            canvas.sendToBack(canvasImageFront);
        } else if(!isFrontSelected && canvasImageBack){
            canvas.add(canvasImageBack);
            canvas.sendToBack(canvasImageBack);
        }

        canvas.renderAll();
    }