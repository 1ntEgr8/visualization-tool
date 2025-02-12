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
var ARRAY_START_Y = 30;
var ARRAY_ELEM_WIDTH = 30;
var ARRAY_ELEM_HEIGHT = 30;

var ARRRAY_ELEMS_PER_LINE = 15;
var ARRAY_LINE_SPACING = 130;

var TOP_POS_X = 180;
var TOP_POS_Y = 100;
var TOP_LABEL_X = 130;
var TOP_LABEL_Y =  100;

var PUSH_LABEL_X = 50;
var PUSH_LABEL_Y = 30;
var PUSH_ELEMENT_X = 120;
var PUSH_ELEMENT_Y = 30;

var SIZE = 14;

function BruteForce(am, w, h)
{
    this.init(am, w, h);
}

BruteForce.prototype = new Algorithm();
BruteForce.prototype.constructor = BruteForce;
BruteForce.superclass = Algorithm.prototype;

BruteForce.prototype.init = function(am, w, h)
{
    // Call the unit function of our "superclass", which adds a couple of
    // listeners, and sets up the undo stack
    BruteForce.superclass.init.call(this, am, w, h);

    this.addControls();

    // Useful for memory management
    this.nextIndex = 0;

    // TODO:  Add any code necessary to set up your own algorithm.  Initialize data
    // structures, etc.
    this.setup();
}

BruteForce.prototype.addControls =  function()
{
    this.controls = [];

    addLabelToAlgorithmBar("Text")

    // Text text field
    this.textField = addControlToAlgorithmBar("Text", "");
    this.textField.onkeydown = this.returnSubmit(this.textField, this.findCallback.bind(this), SIZE, false);
    this.controls.push(this.textField);

    addLabelToAlgorithmBar("Pattern")

    // Pattern text field
    this.patternField = addControlToAlgorithmBar("Text", "");
    this.patternField.onkeydown = this.returnSubmit(this.patternField, this.findCallback.bind(this), SIZE, false);
    this.controls.push(this.patternField);

    // Find button
    this.findButton = addControlToAlgorithmBar("Button", "Find");
    this.findButton.onclick = this.findCallback.bind(this);
    this.controls.push(this.findButton);

    // Clear button
    this.clearButton = addControlToAlgorithmBar("Button", "Clear");
    this.clearButton.onclick = this.clearCallback.bind(this);
    this.controls.push(this.clearButton);
}

BruteForce.prototype.setup = function()
{
    this.textRowID = new Array();
    this.comparisonMatrixID = new Array();
}

BruteForce.prototype.reset = function()
{
    // Reset all of your data structures to *exactly* the state they have immediately after the init
    // function is called.  This method is called whenever an "undo" is performed.  Your data
    // structures are completely cleaned, and then all of the actions *up to but not including* the
    // last action are then redone.  If you implement all of your actions through the "implementAction"
    // method below, then all of this work is done for you in the Animation "superclass"

    // Reset the (very simple) memory manager
    this.nextIndex = 0;
}

BruteForce.prototype.findCallback = function(event)
{
    if (this.textField.value != "" && this.patternField.value != ""
        && this.textField.value.length >= this.patternField.value.length)
    {
        this.implementAction(this.clear.bind(this), "");
        var text = this.textField.value;
        var pattern = this.patternField.value;
        this.textField.value = ""
        this.patternField.value = ""
        this.implementAction(this.find.bind(this), text + "," + pattern);
    }
}

BruteForce.prototype.clearCallback = function(event)
{
    this.implementAction(this.clear.bind(this), "");
}

BruteForce.prototype.find = function(params)
{
    this.commands = new Array();

    var text = params.split(",")[0];
    var pattern = params.split(",")[1];

    this.textRowID = new Array(text.length);
    this.comparisonMatrixID = new Array(text.length);
    for (var i = 0; i < text.length; i++) {
        this.comparisonMatrixID[i] = new Array(text.length);
    }

    for (var i = 0; i < text.length; i++)
    {
        var xpos = i * ARRAY_ELEM_WIDTH + ARRAY_START_X;
        var ypos = ARRAY_START_Y;
        this.textRowID[i] = this.nextIndex;
        this.cmd("CreateRectangle", this.nextIndex, text.charAt(i), ARRAY_ELEM_WIDTH, ARRAY_ELEM_HEIGHT, xpos, ypos);
        this.cmd("SetBackgroundColor", this.nextIndex++, "#D3D3D3");
    }

    for (var row = 0; row < text.length; row++)
    {
        for (var col = 0; col < text.length; col++)
        {
            var xpos = col * ARRAY_ELEM_WIDTH + ARRAY_START_X;
            var ypos = (row + 1) * ARRAY_ELEM_HEIGHT + ARRAY_START_Y;
            this.comparisonMatrixID[row][col] = this.nextIndex;
            this.cmd("CreateRectangle", this.nextIndex++, "", ARRAY_ELEM_WIDTH, ARRAY_ELEM_HEIGHT, xpos, ypos);
        }
    }

    var iPointerID = this.nextIndex++;
    var jPointerID = this.nextIndex++;
    this.cmd("CreateHighlightCircle", iPointerID, "#0000FF", ARRAY_START_X, ARRAY_START_Y, ARRAY_ELEM_WIDTH / 2);
    this.cmd("CreateHighlightCircle", jPointerID, "#0000FF", ARRAY_START_X , ARRAY_START_Y + ARRAY_ELEM_HEIGHT, ARRAY_ELEM_HEIGHT / 2);

    var i = 0;
    var j = 0;
    var row = 0;
    while (i <= text.length - pattern.length)
    {
        for (var k = i; k < i + pattern.length; k++)
        {
            this.cmd("SetText", this.comparisonMatrixID[row][k], pattern.charAt(k - i), xpos, ypos);
        }
        this.cmd("Step");
        while (j < pattern.length && pattern.charAt(j) == text.charAt(i + j))
        {
            this.cmd("SetBackgroundColor", this.comparisonMatrixID[row][i + j], "#2ECC71");
            j++;
            this.cmd("Step");
            if (j != pattern.length)
            {
                var xpos = (i + j) * ARRAY_ELEM_WIDTH + ARRAY_START_X;
                this.cmd("Move", iPointerID, xpos, ARRAY_START_Y);
                var ypos = (row + 1) * ARRAY_ELEM_HEIGHT + ARRAY_START_Y;
                this.cmd("Move", jPointerID, xpos, ypos);
                this.cmd("Step");
            }
        }
        if (j != pattern.length)
        {
            this.cmd("SetBackgroundColor", this.comparisonMatrixID[row][i + j], "#E74C3C");
        }
        i++;
        j = 0;
        row++;
        if (i <= text.length - pattern.length)
        {
            var xpos = (i + j) * ARRAY_ELEM_WIDTH + ARRAY_START_X;
            this.cmd("Move", iPointerID, xpos, ARRAY_START_Y);
            var ypos = (row + 1) * ARRAY_ELEM_HEIGHT + ARRAY_START_Y;
            this.cmd("Move", jPointerID, xpos, ypos);
            this.cmd("Step");
        }
    }

    this.cmd("Delete", iPointerID);
    this.cmd("Delete", jPointerID);
    return this.commands;
}

BruteForce.prototype.clear = function()
{
    this.commands = new Array();
    for (var i = 0; i < this.textRowID.length; i++)
    {
        this.cmd("Delete", this.textRowID[i]);
    }
    this.textRowID = new Array();
    for (var i = 0; i < this.comparisonMatrixID.length; i++)
    {
        for (var j = 0; j < this.comparisonMatrixID.length; j++)
        {
            this.cmd("Delete", this.comparisonMatrixID[i][j]);
        }
    }
    this.comparisonMatrixID = new Array();
    return this.commands;
}

// Called by our superclass when we get an animation started event -- need to wait for the
// event to finish before we start doing anything
BruteForce.prototype.disableUI = function(event)
{
    for (var i = 0; i < this.controls.length; i++)
    {
        this.controls[i].disabled = true;
    }
}

// Called by our superclass when we get an animation completed event -- we can
/// now interact again.
BruteForce.prototype.enableUI = function(event)
{
    for (var i = 0; i < this.controls.length; i++)
    {
        this.controls[i].disabled = false;
    }
}

var currentAlg;

function init()
{
    var animManag = initCanvas();
    currentAlg = new BruteForce(animManag, canvas.width, canvas.height);
}
