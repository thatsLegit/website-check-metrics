const Queue = require('../utils/Queue');

class Alerts {
    constructor(lifetime) { 
        this._lifetime = lifetime;
        this._started = null;
        this._timeQueue = new Queue() /* last element contains up-to-date website's availability information */
        this._responseTimeQueue = new Queue();
    }

    get Alert() {
        const last = this._timeQueue.last.value;
        return {
            date: last.date,
            availability: last.availability.value,
        }
    }

    _update_availability({success, t}) {
        const availValue = success ? 1 : 0;
        const lastInserted = this._timeQueue.last;
        let newAvailability;

        this._responseTimeQueue.enqueue(t);

        if(!this._started) {
            this._started = Date.now();
            newAvailability = this._initStat(availValue, t);
        } else if (Date.now() - this._started > this._lifetime) { /* dequeue the oldest element and add last inserted */
            const oldestRecord = this._timeQueue.dequeue();
            this._responseTimeQueue.dequeue();
            newAvailability = this._statFactory({availValue, t}, {...lastInserted.value}, oldestRecord.value);
        } else {
            newAvailability = this._statFactory({availValue, t}, {...lastInserted.value});
        }

        this._timeQueue.enqueue(newAvailability);
        return {
            date: newAvailability.date,
            availability: newAvailability.availability.value,
        }
    }

    _initStat(availValue, t) {
        return {
            t, 
            date: new Date(), 
            availability: {
                value: (availValue / 1) * 100,
                success: availValue == 1 ? true : false,
                totNumCalls : 1,
                successfulCalls : availValue
            }
        }
    }

    _statFactory(res, last, oldest=null) {
        const totNumCalls = oldest  /* aggregate */
            ? last.availability.totNumCalls
            : last.availability.totNumCalls + 1;
        const successfulCalls = oldest /* aggregate */
            ? (last.availability.successfulCalls + res.availValue - oldest.availability.success)
            : (last.availability.successfulCalls + res.availValue);

        return {
            t: res.t, 
            date: new Date(), 
            availability: {
                value: (successfulCalls / totNumCalls) * 100, /* aggregate */
                success: res.availValue, /* element's value */
                totNumCalls : totNumCalls,
                successfulCalls : successfulCalls
            }
        }
    }
}

module.exports = Alerts;