const Queue = require('../utils/Queue');

class Alerts {
    constructor(lifetime) {
        this._lifetime = lifetime;
        this._started = Date.now(); /* init time */
        this._timeQueue = new Queue() /* last element contains up-to-date website's availability information */
    }

    get Alert() {
        const last = this._timeQueue.last.value;
        return {
            date: last.date,
            availability: last.availability.value,
        }
    }

    _updateAlerts({ success }) {
        const availValue = success ? 1 : 0;
        const lastInserted = this._timeQueue.last;
        let newAvailability;

        if (this._timeQueue.size === 0) newAvailability = this._initStat(availValue);
        else if (Date.now() - this._started > this._lifetime) { /* dequeue the oldest element and add last inserted */
            const oldestRecord = this._timeQueue.dequeue();
            newAvailability = this._statFactory(availValue, { ...lastInserted.value }, oldestRecord.value);
        } else {
            newAvailability = this._statFactory(availValue, { ...lastInserted.value });
        }

        this._timeQueue.enqueue(newAvailability);
    }

    _initStat(availValue) {
        return {
            date: new Date(),
            availability: {
                value: (availValue / 1) * 100,
                success: availValue,
                totNumCalls: 1,
                successfulCalls: availValue
            }
        }
    }

    _statFactory(availValue, last, oldest = null) {
        const totNumCalls = oldest  /* aggregate */
            ? last.availability.totNumCalls
            : last.availability.totNumCalls + 1;
        const successfulCalls = oldest /* aggregate */
            ? (last.availability.successfulCalls + availValue - oldest.availability.success)
            : (last.availability.successfulCalls + availValue);

        return {
            date: new Date(),
            availability: {
                value: (successfulCalls / totNumCalls) * 100, /* aggregate */
                success: availValue, /* element's value */
                totNumCalls: totNumCalls,
                successfulCalls: successfulCalls
            }
        }
    }
}

module.exports = Alerts;