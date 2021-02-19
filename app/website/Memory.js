const Statistics = require('./Statistics');
const Alerts = require('./Alerts');

class Memory {
    constructor(parameters) { 
        this._parameters = parameters;
        this._stats = [];
        this._Init();
    }
    _Init() {
        for (const elem of this._parameters.statistics) {
            this._stats.push(new Statistics(elem.lifetime));
        }
        this._alert = new Alerts(this._parameters.alert.lifetime);
    }
    _refreshAllMetrics(data) {
        let res = [];
        for (let stat of this._stats) {
            res.push(stat._updateAll(data));
        }
        return res[0]; /* added for testing */
    }
    _refreshAlerts(data) {
        return this._alert._update_availability(data);
    }
}

module.exports = Memory;