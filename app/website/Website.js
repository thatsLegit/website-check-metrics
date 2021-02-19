const fetch = require('node-fetch');
const colors = require('colors');
const WebsiteFSM = require('../FSM/WebsiteFSM');
const Memory = require('./Memory');

class Website {
    constructor(parameters) {
        this._parameters = parameters;
        this._check = this._check.bind(this);
        this._Init();
    }
    _Init() {
        this._stateMachine = new WebsiteFSM();
        this._stateMachine.SetState('up'); /* start default assumption is that the website is up */
        this._memory = new Memory({
            statistics: this._parameters.periods.lookBackTimePeriod,
            alert: this._parameters.periods.alertPeriod,
        });
        setInterval(() => {
            this._check();
        }, this._parameters.interval);
    }
    _check() {
        let t1 = Date.now();
        fetch(this._parameters.url, { method: 'HEAD' })
        .then(res => {
            const data = {
                success: res.statusText == 'OK'? true : false,
                t: Date.now() - t1,
                code: res.status
            }
            const alert = this._memory._refreshAlerts(data); /* generates alert report based on received data */
            this._memory._refreshAllMetrics(data);
            this._stateMachine.Update({...alert, url: this._parameters.url});
        })
        .catch(err => {
            console.error(err);
            throw new Error(`An unexpected error occured while checking website ${this._parameters.url}`.red);
        });
    }
}

module.exports = Website;