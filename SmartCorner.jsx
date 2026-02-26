#target photoshop

var _sc_opts;

// La fonction qui s'exécute dans un seul historique (Undo groupé)
function _sc_doPlace() {
    var doc = app.activeDocument;
    var layer = doc.activeLayer;

    var prevUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    try {
        var opts = _sc_opts;

        var docW = doc.width.value, docH = doc.height.value;
        var targetW = Math.round(docW / 2), targetH = Math.round(docH / 2);

        var relock = false;
        if (layer.allLocked) { layer.allLocked = false; relock = true; }

        var b = layer.bounds;
        var curW = (b[2].value - b[0].value);
        var curH = (b[3].value - b[1].value);

        var scaleX, scaleY;
        if (opts.keep) {
            var scale = Math.min(targetW / curW, targetH / curH) * 100;
            scaleX = scale;
            scaleY = scale;
        } else {
            scaleX = (targetW / curW) * 100;
            scaleY = (targetH / curH) * 100;
        }

        layer.resize(scaleX, scaleY, AnchorPosition.MIDDLECENTER);

        b = layer.bounds;
        var newW = (b[2].value - b[0].value);
        var newH = (b[3].value - b[1].value);

        var margin = 0;
        var targetX, targetY;
        switch (opts.corner) {
            case 'tl': targetX = margin; targetY = margin; break;
            case 'tr': targetX = docW - newW - margin; targetY = margin; break;
            case 'bl': targetX = margin; targetY = docH - newH - margin; break;
            case 'br': targetX = docW - newW - margin; targetY = docH - newH - margin; break;
        }

        var curLeft = b[0].value;
        var curTop = b[1].value;
        layer.translate(targetX - curLeft, targetY - curTop);

        if (relock) layer.allLocked = true;
    } finally {
        app.preferences.rulerUnits = prevUnits;
    }
}

(function () {
    if (!app.documents.length) { alert("Open a document first."); return; }

    var w = new Window('dialog', "SmartCorner");
    w.orientation = 'column';
    w.alignChildren = 'fill';

    w.add('statictext', undefined, "Click a button to place the layer:");

    var grid = w.add('group'); grid.orientation = 'row';
    var col1 = grid.add('group'); col1.orientation = 'column'; col1.alignChildren = 'fill';
    var col2 = grid.add('group'); col2.orientation = 'column'; col2.alignChildren = 'fill';

    var bTL = col1.add('button', undefined, 'Top-Left');
    var bBL = col1.add('button', undefined, 'Bottom-Left');
    var bTR = col2.add('button', undefined, 'Top-Right');
    var bBR = col2.add('button', undefined, 'Bottom-Right');

    var keep = w.add('checkbox', undefined, 'Keep proportions (fit inside the area)');
    keep.value = false;

    var closeBtn = w.add('button', undefined, 'Close', { name: 'cancel' });

    function executePlace(cornerType) {
        if (!app.documents.length) return;
        var doc = app.activeDocument;
        var layer = doc.activeLayer;

        if (!layer) { alert("Select a layer to place."); return; }
        if (layer.isBackgroundLayer) { alert("Select a layer other than the Background."); return; }

        _sc_opts = { corner: cornerType, keep: keep.value };

        try {
            // Groupe toutes les actions de transformation en 1 seul Undo nommé "SmartCorner"
            doc.suspendHistory("SmartCorner", "_sc_doPlace()");

            // FORCES Photoshop to redraw the screen immediately!
            app.refresh();
        } catch (e) {
            alert("Error: " + e);
        }
    }

    // Assign clicks but do NOT close the window
    bTL.onClick = function () { executePlace('tl'); };
    bTR.onClick = function () { executePlace('tr'); };
    bBL.onClick = function () { executePlace('bl'); };
    bBR.onClick = function () { executePlace('br'); };

    closeBtn.onClick = function () { w.close(); };

    w.show();
})();
