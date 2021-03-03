const Queue = require('../utils/Queue');

class Statistics {
    constructor(lifetime) {
        this._lifetime = lifetime;
        this._started = Date.now(); /* init time */
        this._responseTimeQueue = new Queue(); /* records each response time to find the max response */
        this._timeQueue = new Queue(); /* last element contains up-to-date website's metrics */
    }

    get stats() {
        const latestStats = this._timeQueue.last.value;
        return {
            lifetime: this._lifetime,
            availability: latestStats.availability.value,
            maxResponseTime: latestStats.maxResponseTime,
            avgResponseTime: latestStats.avgResponseTime.value,
            responseCodes: latestStats.responseCodes.count
        }
    }

    _updateAllMetrics({ success, t, code }) {
        const availValue = success ? 1 : 0;
        const lastInserted = this._timeQueue.last;
        let newStat;

        this._responseTimeQueue.enqueue(t);

        if (this._timeQueue.size === 0) newStat = this._initStat(availValue, t, code);
        else if (Date.now() - this._started > this._lifetime) { /* dequeue the oldest element and add last inserted */
            const oldestRecord = this._timeQueue.dequeue();
            this._responseTimeQueue.dequeue();
            newStat = this._statFactory({ availValue, t, code }, { ...lastInserted.value }, oldestRecord.value);
        } else { /* before lifetime has been reached (ex: 3min after the lauch for a 10min lifetime) */
            newStat = this._statFactory({ availValue, t, code }, { ...lastInserted.value });
        }

        this._timeQueue.enqueue(newStat);
    }

    _initStat(availValue, t, code) {
        return {
            availability: {
                value: (availValue / 1) * 100,
                success: availValue,
                totNumCalls: 1,
                successfulCalls: availValue
            },
            maxResponseTime: t,
            avgResponseTime: {
                value: t,
                t,
                totTime: t, /* tot time spent on calls */
                totNumCalls: 1
            },
            responseCodes: {
                code,
                count: { [code]: 1 }
            }
        }
    }

    _statFactory(res, last, oldest = null) {
        const AvailTotNumCalls = oldest  /* aggregate */
            ? last.availability.totNumCalls
            : last.availability.totNumCalls + 1;
        const AvailSuccessfulCalls = oldest /* aggregate */
            ? (last.availability.successfulCalls + res.availValue - oldest.availability.success)
            : (last.availability.successfulCalls + res.availValue);

        const avgTotTime = oldest  /* aggregate */
            ? (last.avgResponseTime.totTime + res.t - oldest.avgResponseTime.t)
            : (last.avgResponseTime.totTime + res.t);
        const avgTotNumCalls = oldest  /* aggregate */
            ? last.avgResponseTime.totNumCalls
            : last.avgResponseTime.totNumCalls + 1;

        const respCodeCount = { /* aggregate */
            ...last.responseCodes.count,
            [res.code]: last.responseCodes.count?.[res.code] ? last.responseCodes.count[res.code] + 1 : 1,
        };
        oldest && respCodeCount[oldest.responseCodes.code]--;

        return {
            availability: {
                value: (AvailSuccessfulCalls / AvailTotNumCalls) * 100, /* aggregate */
                success: res.availValue, /* element's value */
                totNumCalls: AvailTotNumCalls,
                successfulCalls: AvailSuccessfulCalls
            },
            maxResponseTime: Math.max(this._responseTimeQueue.findMax(), res.t),
            avgResponseTime: {
                value: avgTotTime / avgTotNumCalls, /* aggregate */
                t: res.t, /* element's value */
                totTime: avgTotTime,
                totNumCalls: avgTotNumCalls
            },
            responseCodes: {
                code: res.code, /* element's value */
                count: respCodeCount
            }
        }
    }
}

module.exports = Statistics;