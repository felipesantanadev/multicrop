# MultiCrop

A MultiCrop workspace built with Fabric JS.

## Import CSS and Font Icons
```
<link href="./css/multicrop.css" rel="stylesheet" />
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

## Import the Javascript files
```
<script src="./js/fabric.min.js"></script>
<script src="./js/multicrop.js"></script>
```

## Usage

Apply the following `div` in the place you want to display the workspace.

```
<div class="workspace-container"></div>
```

Load the workspace when needed.

```
var multiCrop = new MultiCrop();
multiCrop.loadWorkspace();
```

You can configure many properties of the workspace

```
multiCrop.loadWorkspace({
        width: 850, // Canvas width
        height: 425, // Canvas height
        defaultCropAreaWidth: 100, //  Crop object's default width
        defaultCropAreaHeight: 120, // Crop object's default height
        cropAreaColor: 'red', // Crop object's color (any RGB value)
        cropAreaOpacity: 0.6, // Crop object's opacity
        imageFormat: 'bmp', // Cropped images format
        devMode: false, // Enables or disables the coordinates console
        isFrontAndBack: true, // Indicates if the workspace works with front and back images
        displayCropResults: true, // Enables or disables the crop results visualization
        initialCropAreas: [
            { isFront: true, name: "recorte1", x: 10, y: 40.9756862745098, width: 81, height: 61 },
            { isFront: true, name: "recorte2", x: 95.79764705882354, y: 33.981176470588224, width: 81, height: 61 },
            { isFront: false, name: "recorte3", x: 10.000000000000021, y: 109.92156862745097, width: 81, height: 61 },
            { isFront: false, name: "recorte4", x: 95.79764705882356, y: 105.92470588235292, width: 81, height: 61 }
        ], // Applies initial crop objects in the workspace
        // You can remove default buttons by using the disableButtons property:
        // disableButtons: ['add-image', 'add-crop', 'crop-all', 'remove-crop']
});
```

### Adding a custom button

```
multiCrop.loadWorkspace({
    ...
}).then(() => {
    // multiCrop.addButton('id', 'class', 'material icon', 'text', click_function);
    // Eg:
    multiCrop.addButton('my-id', 'my-class', 'print', 'Click me', () => console.log('click event'));
});
```

You can search for icons on https://material.io/resources/icons.

### Getting the cropped images

```
multiCrop.getCroppedImages();
```