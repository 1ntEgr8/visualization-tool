// Copyright 2011 David Galles, University of San Francisco. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of the University of San Francisco

var ARRAY_START_X = 100;
var ARRAY_START_Y = 200;
var ARRAY_ELEM_WIDTH = 50;
var ARRAY_ELEM_HEIGHT = 50;

var ARRRAY_ELEMS_PER_LINE = 15;
var ARRAY_LINE_SPACING = 130;

var lastSwapEnabled = true;

function CocktailSort(am, w, h) {
    this.init(am, w, h);
}

CocktailSort.prototype = new Algorithm();
CocktailSort.prototype.constructor = CocktailSort;
CocktailSort.superclass = Algorithm.prototype;

CocktailSort.prototype.init = function (am, w, h) {
    // Call the unit function of our "superclass", which adds a couple of
    // listeners, and sets up the undo stack
    CocktailSort.superclass.init.call(this, am, w, h);

    this.addControls();

    // Useful for memory management
    this.nextIndex = 0;

    // TODO:  Add any code necessary to set up your own algorithm.  Initialize data
    // structures, etc.
    this.setup();
}

CocktailSort.prototype.addControls = function () {
    this.controls = [];

    addLabelToAlgorithmBar("Comma separated list (e.g. \"3,1,2\", max 18 elements)")

    // List text field
    this.listField = addControlToAlgorithmBar("Text", "");
    this.listField.onkeydown = this.returnSubmit(this.listField, this.sortCallback.bind(this), 60, false);
    this.controls.push(this.listField);

    // Sort button
    this.findButton = addControlToAlgorithmBar("Button", "Sort");
    this.findButton.onclick = this.sortCallback.bind(this);
    this.controls.push(this.findButton);

    // Clear button
    this.clearButton = addControlToAlgorithmBar("Button", "Clear");
    this.clearButton.onclick = this.clearCallback.bind(this);
    this.controls.push(this.clearButton);

    // Last swap optimization toggle
    this.lastSwapCheckbox = addCheckboxToAlgorithmBar("Enable last swap optimization", true)
    this.lastSwapCheckbox.onclick = this.toggleLastSwap.bind(this);
    this.controls.push(this.lastSwapCheckbox);
}

CocktailSort.prototype.setup = function () {
    this.arrayData = new Array();
    this.arrayID = new Array();
    this.displayData = new Array();
    this.iPointerID = this.nextIndex++;
    this.jPointerID = this.nextIndex++;
}

CocktailSort.prototype.reset = function () {
    // Reset all of your data structures to *exactly* the state they have immediately after the init
    // function is called.  This method is called whenever an "undo" is performed.  Your data
    // structures are completely cleaned, and then all of the actions *up to but not including* the
    // last action are then redone.  If you implement all of your actions through the "implementAction"
    // method below, then all of this work is done for you in the Animation "superclass"

    // Reset the (very simple) memory manager
    this.nextIndex = 0;
}

CocktailSort.prototype.sortCallback = function (event) {
    if (this.listField.value != "") {
        this.clear();
        var list = this.listField.value;
        this.listField.value = "";
        this.implementAction(this.sort.bind(this), list);
    }
}

CocktailSort.prototype.clearCallback = function (event) {
    this.implementAction(this.clear.bind(this), "");
}

CocktailSort.prototype.toggleLastSwap = function (event) {
    lastSwapEnabled = !lastSwapEnabled;
}

CocktailSort.prototype.clear = function () {
    this.arrayData = new Array();
    this.commands = new Array();
    this.displayData = new Array();
    for (let i = 0; i < this.arrayID.length; i++) {
        this.cmd("Delete", this.arrayID[i]);
    }
    return this.commands;
}


CocktailSort.prototype.sort = function (params) {
    this.commands = new Array();

    this.arrayID = new Array();
    this.arrayData = params.split(",").map(Number).filter(x => x).slice(0, 18);
    this.displayData = new Array(this.arrayData.length);
    var length = this.arrayData.length;

    let elemCounts = new Map();
    let letterMap = new Map();

    for (let i = 0; i < length; i++) {
        let count = elemCounts.has(this.arrayData[i]) ? elemCounts.get(this.arrayData[i]) : 0;
        if (count > 0) {
            letterMap.set(this.arrayData[i], "A");
        }
        elemCounts.set(this.arrayData[i], count + 1);
    }

    for (let i = 0; i < length; i++) {
        this.arrayID[i] = this.nextIndex++;
        var xpos = i * ARRAY_ELEM_WIDTH + ARRAY_START_X;
        var ypos = ARRAY_START_Y;

        let displayData = this.arrayData[i].toString();
        if (letterMap.has(this.arrayData[i])) {
            let currChar = letterMap.get(this.arrayData[i]);
            displayData += currChar;
            letterMap.set(this.arrayData[i], String.fromCharCode(currChar.charCodeAt(0) + 1));
        }
        this.displayData[i] = displayData;
        this.cmd("CreateRectangle", this.arrayID[i], displayData, ARRAY_ELEM_WIDTH, ARRAY_ELEM_HEIGHT, xpos, ypos);
    }
    this.cmd("CreateHighlightCircle", this.iPointerID, "#0000FF", ARRAY_START_X, ARRAY_START_Y);
    this.cmd("SetHighlight", this.iPointerID, 1);
    this.cmd("CreateHighlightCircle", this.jPointerID, "#0000FF", ARRAY_START_X + ARRAY_ELEM_WIDTH, ARRAY_START_Y);
    this.cmd("SetHighlight", this.jPointerID, 1);
    this.cmd("Step");

    var sorted = true;
    var start = 0;
    var end = this.arrayData.length - 1;
    var lastSwapped = 0;
    do {
        sorted = true;
        for (var i = start; i < end; i++) {
            this.movePointers(i, i + 1);
            if (this.arrayData[i] > this.arrayData[i + 1]) {
                this.swap(i, i + 1);
                sorted = false;
                lastSwapped = i;
            }
        }
        if (lastSwapEnabled) {
            end = lastSwapped;
        } else {
            end--;
        }
        if (!sorted) {
            for (var i = end + 1; i < this.arrayData.length; i++) {
                this.cmd("SetBackgroundColor", this.arrayID[i], "#2ECC71");
            }
            this.cmd("Step")
        }
        if (!sorted) {
            sorted = true;
            for (var i = end; i > start; i--) {
                this.movePointers(i - 1, i);
                if (+this.arrayData[i] < +this.arrayData[i - 1]) {
                    this.swap(i, i - 1);
                    sorted = false;
                    lastSwapped = i;
                }
            }
            if (lastSwapEnabled) {
                start = lastSwapped;
            } else {
                start++;
            }
            if (!sorted) {
                for (var i = start - 1; i >= 0; i--) {
                    this.cmd("SetBackgroundColor", this.arrayID[i], "#2ECC71");
                }
                this.cmd("Step")
            }
        }
    } while (!sorted);

    this.cmd("Delete", this.iPointerID);
    this.cmd("Delete", this.jPointerID);
    this.cmd("Step");

    for (var i = 0; i < this.arrayData.length; i++) {
        this.cmd("SetBackgroundColor", this.arrayID[i], "#2ECC71");
    }
    this.cmd("Step")

    return this.commands;
}

CocktailSort.prototype.movePointers = function (i, j) {
    var iXPos = i * ARRAY_ELEM_WIDTH + ARRAY_START_X;
    var iYPos = ARRAY_START_Y;
    this.cmd("Move", this.iPointerID, iXPos, iYPos);
    var jXPos = j * ARRAY_ELEM_WIDTH + ARRAY_START_X;
    var jYPos = ARRAY_START_Y;
    this.cmd("Move", this.jPointerID, jXPos, jYPos);
    this.cmd("Step");
}

CocktailSort.prototype.swap = function (i, j) {
    this.cmd("SetForegroundColor", this.iPointerID, "#FF0000");
    this.cmd("SetForegroundColor", this.jPointerID, "#FF0000");
    var iLabelID = this.nextIndex++;
    var iXPos = i * ARRAY_ELEM_WIDTH + ARRAY_START_X;
    var iYPos = ARRAY_START_Y;
    this.cmd("CreateLabel", iLabelID, this.displayData[i], iXPos, iYPos);
    var jLabelID = this.nextIndex++;
    var jXPos = j * ARRAY_ELEM_WIDTH + ARRAY_START_X;
    var jYPos = ARRAY_START_Y;
    this.cmd("CreateLabel", jLabelID, this.displayData[j], jXPos, jYPos);
    this.cmd("Settext", this.arrayID[i], "");
    this.cmd("Settext", this.arrayID[j], "");
    this.cmd("Move", iLabelID, jXPos, jYPos);
    this.cmd("Move", jLabelID, iXPos, iYPos);
    this.cmd("Step");
    this.cmd("Settext", this.arrayID[i], this.displayData[j]);
    this.cmd("Settext", this.arrayID[j], this.displayData[i]);
    this.cmd("Delete", iLabelID);
    this.cmd("Delete", jLabelID);

    // Swap actual data
    let temp = this.arrayData[i];
    this.arrayData[i] = this.arrayData[j];
    this.arrayData[j] = temp;

    // Swap displayed data
    temp = this.displayData[i];
    this.displayData[i] = this.displayData[j];
    this.displayData[j] = temp;

    this.cmd("SetForegroundColor", this.iPointerID, "#0000FF");
    this.cmd("SetForegroundColor", this.jPointerID, "#0000FF");
    this.cmd("Step");
}

// Called by our superclass when we get an animation started event -- need to wait for the
// event to finish before we start doing anything
CocktailSort.prototype.disableUI = function (event) {
    for (var i = 0; i < this.controls.length; i++) {
        this.controls[i].disabled = true;
    }
}

// Called by our superclass when we get an animation completed event -- we can
/// now interact again.
CocktailSort.prototype.enableUI = function (event) {
    for (var i = 0; i < this.controls.length; i++) {
        this.controls[i].disabled = false;
    }
}


var currentAlg;

function init() {
    var animManag = initCanvas();
    currentAlg = new CocktailSort(animManag, canvas.width, canvas.height);

}

z
