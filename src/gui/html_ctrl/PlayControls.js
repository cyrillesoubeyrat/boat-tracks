// * @module PlayControls
import { CLASS_CONTROL, CLASS_UNSELECTABLE } from 'ol/css.js';
import Control from 'ol/control/Control.js';

// * @classdesc PlayControls
// * A control with a collection of buttons:
// * - Start/Pause button
// * - Restart button
// * - Increase boats speed button
// * - Decrease boats speed button
// * - Stop button
// * For styling this control,
// * - use the css selectors
// *   `.play-ctrl-start`, `.play-ctrl-pause`, `.play-ctrl-restart`,
// *   `.play-ctrl-increaseSpeed`, `.play-ctrl-decreaseSpeed`, `.play-ctrl-stop`
class PlayControls extends Control {
    #playstate;

    // @param {Object} [optional_options] (Control options).
    constructor(optional_options) {
        const options = optional_options || {};

        super({
            element: document.createElement('div'),
            target: options.target,
        });

        /*
            @private members:
        */
        // @type {string}
        this._cssClassNames = options.className != undefined? options.className : 'play-ctrl ' + CLASS_UNSELECTABLE + ' ' + CLASS_CONTROL;
        const className = options.className || 'play-ctrl';
        this._startClassName = className + '-start';
        this._pauseClassName = className + '-pause';
        this._increaseSpeedClassName = className + '-increaseSpeed';
        this._decreaseSpeedClassName = className + '-decreaseSpeed';
        this._restartClassName = className + '-restart';
        this._stopClassName = className + '-stop';
        this._startBtn = null;
        this._pauseBtn = null;
        this._increaseSpeedBtn = null;
        this._decreaseSpeedBtn = null;
        this._restartBtn = null;
        this._stopBtn = null;

        this.#playstate = PlayState.UNSET;

        // @type {Function}
        this._onStartClickedHandler = null;
        this._onPauseClickedHandler = null;
        this._onIncreaseSpeedClickedHandler = null;
        this._onDecreaseSpeedClickedHandler = null;
        this._onRestartClickedHandler = null;
        this._onStopClickedHandler = null;

        const startTipLabel = options.startTipLabel != undefined ? options.stopTipLabel : 'Start sailing';
        const pauseTipLabel = options.pauseTipLabel != undefined ? options.pauseTipLabel : 'Pause sailing';
        const restartTipLabel = options.restartTipLabel != undefined ? options.restartTipLabel : 'Restart sailing';
        const increaseSpeedTipLabel = options.increaseSpeedTipLabel != undefined ? options.increaseSpeedTipLabel : 'Increase boats speed';
        const decreaseSpeedTipLabel = options.decreaseSpeedTipLabel != undefined ? options.decreaseSpeedTipLabel : 'Decrease boats speed';
        const stopTipLabel = options.stopTipLabel != undefined ? options.stopTipLabel : 'Stop Sailing';

        const startIconImagePath = options.startIconImagePath || "./icons/play_arrow_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";
        const pauseIconImImagePath = options.pauseIconImagePath || "./icons/pause_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";
        const stopIconImagePath = options.stopIconSvgPath || "./icons/stop_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";
        const restartIconImagePath = options.restartIconImagePath || "./icons/skip_previous_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";
        const increaseSpeedIconImagePath = options.increaseSpeedIconImagePath || "./icons/clock_arrow_up_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";
        const decreaseSpeedIconImagePath = options.decreaseSpeedIconImagePath || "./icons/clock_arrow_down_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg";
        
        this.element.className = this._cssClassNames;
        this.element.classList.add("show");
        this.element.setAttribute("display", "flex");
        this.element.setAttribute("flex-direction", "column")
        
        // Create the start button
        let button = document.createElement('button');
        this._startBtn = button;
        button.className = this._startClassName;
        button.classList.add("show");
        button.classList.add("show");
        button.setAttribute('type', 'button');
        button.title = startTipLabel;
        button.style.backgroundImage = "url('" + startIconImagePath + "')";
        // Create the SVG icon
        // let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // svgElement.setAttribute("width", iconsWidth);
        // svgElement.setAttribute("height", iconsHeigth);
        // let svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        // svgPath.setAttributeNS(null, "stroke-width", iconsStrokeWidth);
        // svgPath.setAttributeNS(null, "fill", iconsColor);
        // svgPath.setAttributeNS(null, "d", startIconImagePath);
        // svgElement.appendChild(svgPath);
        // Append SVG icon to the button
        // button.appendChild(svgElement);
        this.element.appendChild(button);

        // Create the pause button
        button = document.createElement('button');
        this._pauseBtn = button;
        button.className = this._pauseClassName;
        button.setAttribute('type', 'button');
        button.title = pauseTipLabel;
        button.style.backgroundImage = "url('" + pauseIconImImagePath + "')";
        this.element.appendChild(button);

        // Create the speed up button
        button = document.createElement('button');
        this._increaseSpeedBtn = button;
        button.className = this._increaseSpeedClassName;
        button.classList.add("show");
        button.classList.add("disabled");
        button.setAttribute('type', 'button');
        button.title = increaseSpeedTipLabel;
        button.style.backgroundImage = "url('" + increaseSpeedIconImagePath + "')";
        this.element.appendChild(button);

        // Create the slow down button
        button = document.createElement('button');
        this._decreaseSpeedBtn = button;
        button.className = this._decreaseSpeedClassName;
        button.classList.add("show");
        button.classList.add("disabled");
        button.setAttribute('type', 'button');
        button.title = decreaseSpeedTipLabel;
        button.style.backgroundImage = "url('" + decreaseSpeedIconImagePath + "')";
        this.element.appendChild(button);

        // Create the restart button
        button = document.createElement('button');
        this._restartBtn = button;
        button.className = this._restartClassName;
        button.classList.add("show");
        button.classList.add("disabled");
        button.setAttribute('type', 'button');
        button.title = restartTipLabel;
        button.style.backgroundImage = "url('" + restartIconImagePath + "')";
        this.element.appendChild(button);

        // Create the stop button
        button = document.createElement('button');
        this._stopBtn = button;
        button.className = this._stopClassName;
        button.classList.add("show");
        button.classList.add("disabled");
        button.setAttribute('type', 'button');
        button.title = stopTipLabel;
        button.style.backgroundImage = "url('" + stopIconImagePath + "')";
        this.element.appendChild(button);

        this._updateState(PlayState.OFF);

        this.element.addEventListener('click', this._handleClick.bind (this));
    }
    

    /*
        @public methods:
    */

    /**
      @param {Function} handler
     */
    set onPlayClicked(handler) {
        this._onStartClickedHandler = handler.bind(this);
    }
    /**
      @param {Function} handler
     */
    set onPauseClicked(handler) {
        this._onPauseClickedHandler = handler.bind(this);
    }
    /**
      @param {Function} handler
     */
    set onIncreaseSpeedClicked(handler) {
        this._onIncreaseSpeedClickedHandler = handler.bind(this);
    }
    /**
      @param {Function} handler
     */
    set onDecreaseSpeedClicked(handler) {
        this._onDecreaseSpeedClickedHandler = handler.bind(this);
    }
    /**
      @param {Function} handler
     */
    set onRestartClicked(handler) {
        this._onRestartClickedHandler = handler.bind(this);
    }
    /**
      @param {Function} handler
     */
    set onStopClicked(handler) {
        this._onStopClickedHandler = handler.bind(this);
    }

    /**
      @param {none}
    */
    reset() {
        this._updateState(PlayState.PAUSED);
    }

    /**
      @param {none}
    */
    resume() {
        this._updateState(PlayState.PLAYING);
    }

    /**
      @param {none}
    */
    disable() {
        this._updateState(PlayState.OFF);
    }


    /*
        @private methods:
    */
    
    _updateState(newState) {
        if (this.#playstate != newState) {
            if (newState == PlayState.RESTARTED) {
                newState = PlayState.PLAYING;
                this.#playstate = PlayState.PLAYING;
            }
            if (newState == PlayState.PLAYING) {
                this._startBtn.classList.remove("show");
                this._pauseBtn.classList.add("show");
                this._increaseSpeedBtn.classList.remove("disabled");
                this._decreaseSpeedBtn.classList.remove("disabled");
                this._restartBtn.classList.remove("disabled");
                this._stopBtn.classList.remove("disabled");
            }
            else if (newState == PlayState.PAUSED || newState == PlayState.ON) {
                this._startBtn.classList.add("show");
                this._pauseBtn.classList.remove("show");
                this._startBtn.classList.remove("disabled");
                this._increaseSpeedBtn.classList.add("disabled");
                this._decreaseSpeedBtn.classList.add("disabled");
                this._restartBtn.classList.add("disabled");
                this._stopBtn.classList.add("disabled");
            }
            else if (newState == PlayState.OFF) {
                this._startBtn.classList.add("show");
                this._pauseBtn.classList.remove("show");
                this._startBtn.classList.add("disabled");
                this._increaseSpeedBtn.classList.add("disabled");
                this._decreaseSpeedBtn.classList.add("disabled");
                this._restartBtn.classList.add("disabled");
                this._stopBtn.classList.add("disabled");
            }

            this.#playstate = newState;
        }
    }

    _handleClick(event) {
        let clickedTarget = event.target;
        let newState = this.#playstate;

        if (clickedTarget == this._startBtn) {
            newState = PlayState.PLAYING;
            if (this._onStartClickedHandler) {
                this._onStartClickedHandler(event);
            }
        }
        else if (clickedTarget == this._pauseBtn) {
            newState = PlayState.PAUSED;
            if (this._onPauseClickedHandler) {
                this._onPauseClickedHandler(event);
            }
        }
        else if (clickedTarget == this._increaseSpeedBtn) {
            newState = PlayState.PLAYING;
            if (this._onIncreaseSpeedClickedHandler) {
                this._onIncreaseSpeedClickedHandler(event);
            }
       }
        else if (clickedTarget == this._decreaseSpeedBtn) {
            newState = PlayState.PLAYING;
            if (this._onDecreaseSpeedClickedHandler) {
                this._onDecreaseSpeedClickedHandler(event);
            }
        }
        else if (clickedTarget == this._restartBtn) {
            newState = PlayState.RESTARTED;
            if (this._onRestartClickedHandler) {
                this._onRestartClickedHandler(event);
            }
        }
        else if (clickedTarget == this._stopBtn) {
            newState = PlayState.OFF;
            if (this._onStopClickedHandler) {
                if (!this._onStopClickedHandler(event)) {
                    newState = PlayState.PAUSED;
                }
            }
        }
        this._updateState(newState);
    }

}

// * Private classes

class PlayState {
    static UNSET = -1;
    static OFF = 1;
    static PLAYING = 2;
    static PAUSED = 3;
    static RESTARTED = 4;

    constructor(name) {
        this.name = name;
    }
}

export default PlayControls;