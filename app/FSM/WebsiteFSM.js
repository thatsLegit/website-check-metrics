const FiniteStateMachine = require('./FiniteStateMachine');
const {UpState, DownState} = require('./website-states');


class WebsiteFSM extends FiniteStateMachine {
    constructor() {
        super();
        this._Init();
    }

    _Init() {
        this._AddState('up', UpState);
        this._AddState('down', DownState);
    }
}

module.exports = WebsiteFSM;