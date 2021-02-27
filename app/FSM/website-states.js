const State = require('./State');
const commonEmitter = require('../utils/events_common');

class UpState extends State {
    constructor(parent) {
        super(parent);
    }

    get Name() {
        return 'up';
    }
  
    Update(alert) {
        if(alert.availability < 80) this._parent.SetState('down', alert);
    }
}

class DownState extends State {
    constructor(parent) {
        super(parent);
    }

    get Name() {
        return 'down';
    }
  
    Enter(_, data) {
        commonEmitter.emit('publish_alert', data);
    }
  
    Exit(data) {
        commonEmitter.emit('publish_alert_resumed', data);
    }
  
    Update(alert) {
        if(alert.availability > 80) this._parent.SetState('up', alert);
    }
}

exports.UpState = UpState;
exports.DownState = DownState;