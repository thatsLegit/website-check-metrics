const commonEmitter = require('./utils/events_common');
const {periods} = require('./utils/timePeriods');
const Website = require('./website/Website');


class Controller {
    constructor(input) {
        this._input = input;
        this._websites = [];
        this._extractStats = this._extractStats.bind(this);
        this._Init();
    }

    _Init() { /* create all the website instances */
        for(const elem of this._input) {
            this._websites.push(new Website({
                interval: elem.interval, /* the interval at which the website must be checked */
                url: elem.url,
                periods
            }));
        }
        this._extractStats(); /* periodically extract stats from each website's memory */
    }
    _extractStats() {
        /* publishRates and corresponding lookBackTimePeriod are at the same index in periods*/
        for (let i=0; i<periods.publishRates.length; i++) { 
            this._websites.forEach(w => {
                setInterval(() => {
                    const data = {
                        url: w._parameters.url, /* url of the website */
                        stats: w._memory._stats[i].stats, /* stats getter */
                        period: periods.publishRates[i].publish /* set to 10min and 1h */
                    };
                    commonEmitter.emit('publish_stats', data);
                }, periods.publishRates[i].publish);
            });
        }
    }
}

module.exports = Controller;