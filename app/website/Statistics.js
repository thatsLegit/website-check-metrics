const Queue = require('../utils/Queue');

class Statistics { 
    constructor(lifetime) {
        this._lifetime = lifetime;
        this._started = Date.now(); /* init time */
        this._responseTimeQueue = new Queue(); /* records each response time to find the max response */
        this._timeQueue = new Queue(); /* last element contains up-to-date website's metrics */
        this._upTime = { /* The uptime persists over the lifetime */
            value: 0,
            ref: Date.now()
        };
    }

    get stats() {
        const latestStats = this._timeQueue.last.value;
        return {
            upTime: Date.now() - this._upTime.ref, /* uptime is the time since the last call with resp status != 'OK' */
            lifetime: this._lifetime,
            availability: latestStats.availability.value,
            maxResponseTime: latestStats.maxResponseTime,
            avgResponseTime: latestStats.avgResponseTime.value,
            responseCodes: latestStats.responseCodes.count
        }
    }

    _updateAll({success, t, code}) {
        if(success === false) this._upTime = {value: 0, ref: Date.now()} 
        else this._upTime.value = Date.now() - this._upTime.ref;

        const availValue = success ? 1 : 0;
        const lastInserted = this._timeQueue.last;
        let newStat;

        this._responseTimeQueue.enqueue(t);

        if(this._timeQueue.size === 0) newStat = this._initStat(availValue, t, code); 
        else if (Date.now() - this._started > this._lifetime) { /* dequeue the oldest element and add last inserted */
            const oldestRecord = this._timeQueue.dequeue();
            this._responseTimeQueue.dequeue();
            newStat = this._statFactory({availValue, t, code}, {...lastInserted.value}, oldestRecord.value);
            newStat.responseCodes.count[oldestRecord.responseCodes.code]--;
        } else { /* before lifetime has been reached (ex: 3min after the lauch for a 10min lifetime) */
            newStat = this._statFactory({availValue, t, code}, {...lastInserted.value});
        }

        this._timeQueue.enqueue(newStat);
        return this.stats; /* for testing */
    }

    _initStat(availValue, t, code) {
        return {
            availability: {
                value: (availValue / 1) * 100, 
                success: availValue == 1 ? true : false,
                totNumCalls : 1,
                successfulCalls : availValue
            },
            maxResponseTime: t,
            avgResponseTime: {
                value: t,
                t,
                totTime : t, /* tot time spent on calls */
                totNumCalls : 1
            },
            responseCodes: {
                code,
                count: {[code]: 1}
            }
        }
    }

    _statFactory(res, last, oldest=null) {
        const AvTotNumCalls = oldest  /* aggregate */
            ? last.availability.totNumCalls
            : last.availability.totNumCalls + 1;
        const AvSuccessfulCalls = oldest /* aggregate */
            ? (last.availability.successfulCalls + res.availValue - oldest.availability.success)
            : (last.availability.successfulCalls + res.availValue);

        const avgTotTime = oldest  /* aggregate */
            ? (last.avgResponseTime.totTime + res.t - oldest.avgResponseTime.t)
            : (last.avgResponseTime.totTime + res.t);
        const avgTotNumCalls = oldest  /* aggregate */
            ? last.avgResponseTime.totNumCalls
            : last.avgResponseTime.totNumCalls + 1;

        return {
            availability: {
                value: (AvSuccessfulCalls / AvTotNumCalls) * 100, /* aggregate */
                success: res.availValue, /* element's value */
                totNumCalls : AvTotNumCalls,
                successfulCalls : AvSuccessfulCalls
            },
            maxResponseTime: Math.max(this._responseTimeQueue.findMax(), res.t),  
            avgResponseTime: {
                value: avgTotTime / avgTotNumCalls, /* aggregate */
                t: res.t, /* element's value */
                totTime : avgTotTime,
                totNumCalls : avgTotNumCalls
            },
            responseCodes: {
                code: res.code, /* element's value */
                count: { /* aggregate */
                    ...last.responseCodes.count,
                    [res.code]: last.responseCodes.count?.[res.code] ? last.responseCodes.count[res.code] + 1 : 1
                }
            }
        }
    }
}

module.exports = Statistics;