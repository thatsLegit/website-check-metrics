const expect = require('chai').expect;
const sinon = require('sinon');

const Statistics = require('../app/website/Statistics');
const { periods } = require('../app/utils/timePeriods');


describe('Stats', function () {

    // pure function
    describe('Statistics._initStat(availValue, t, code)', function () {

        let statistics;

        beforeEach(() => {
            statistics = new Statistics(periods.lookBackTimePeriod[0].lifetime); /* only the 10min look back time period is tested */
        });

        it('Should return correct statistics on successful http call', () => {
            const availValue = 1;
            const t = 100;
            const code = 200;

            const stats = statistics._initStat(availValue, t, code);

            expect(stats.availability.value).to.equal(100);
            expect(stats.availability.success).to.equal(1);
            expect(stats.availability.successfulCalls).to.equal(1);

            expect(stats.maxResponseTime).to.equal(t);

            expect(stats.avgResponseTime.value).to.equal(t);
            expect(stats.avgResponseTime.totTime).to.equal(t);
            expect(stats.avgResponseTime.totNumCalls).to.equal(1);

            expect(stats.responseCodes.count).to.deep.equal({ [code]: 1 });
        });

        it('Should return correct statistics on failed http call', () => {
            const availValue = 0;
            const t = 100;
            const code = 400;

            const stats = statistics._initStat(availValue, t, code);

            expect(stats.availability.value).to.equal(0);
            expect(stats.availability.success).to.equal(0);
            expect(stats.availability.successfulCalls).to.equal(0);

            expect(stats.maxResponseTime).to.equal(t);

            expect(stats.avgResponseTime.value).to.equal(t);
            expect(stats.avgResponseTime.totTime).to.equal(t);
            expect(stats.avgResponseTime.totNumCalls).to.equal(1);

            expect(stats.responseCodes.count).to.deep.equal({ [code]: 1 });
        });
    });

    describe('Statistics._statFactory(res, last, oldest = null)', function () {

        let statistics, last, oldest;

        beforeEach(() => {
            statistics = new Statistics(periods.lookBackTimePeriod[0].lifetime); /* only the 10min look back time period is tested */
            statistics._responseTimeQueue.enqueue(200); /* old */
            statistics._responseTimeQueue.enqueue(150); /* last */
        });

        before(() => {
            oldest = {
                availability: {
                    value: 100,
                    success: 1,
                    totNumCalls: 1,
                    successfulCalls: 1
                },
                maxResponseTime: 200,
                avgResponseTime: {
                    value: 200,
                    t: 200,
                    totTime: 200,
                    totNumCalls: 1
                },
                responseCodes: {
                    code: 200,
                    count: { 200: 1 }
                }
            };
            last = {
                availability: {
                    value: 100,
                    success: 1,
                    totNumCalls: 2,
                    successfulCalls: 2
                },
                maxResponseTime: 200,
                avgResponseTime: {
                    value: 175,
                    t: 150,
                    totTime: 350,
                    totNumCalls: 2
                },
                responseCodes: {
                    code: 200,
                    count: { 200: 2 }
                }
            };
        });

        it('Should return correct statistics with NO oldest value and failed http call', () => {
            const current = {
                availValue: 0,
                t: 500,
                code: 400
            };

            const stats = statistics._statFactory(current, last);

            expect(stats.availability.value).to.equal((2 / 3) * 100); /* current fails */
            expect(stats.availability.success).to.equal(0);
            expect(stats.availability.successfulCalls).to.equal(2);

            expect(stats.maxResponseTime).to.equal(500);

            expect(stats.avgResponseTime.value).to.equal(850 / 3);
            expect(stats.avgResponseTime.totTime).to.equal(850);
            expect(stats.avgResponseTime.totNumCalls).to.equal(3);

            expect(stats.responseCodes.count).to.deep.equal({ 200: 2, 400: 1 });
        });

        it('Should return correct statistics with an oldest value and failed http call', () => {
            statistics._responseTimeQueue.dequeue();

            const current = {
                availValue: 0,
                t: 500,
                code: 400
            };

            const stats = statistics._statFactory(current, last, oldest);

            expect(stats.availability.value).to.equal(50); /* current fails */
            expect(stats.availability.success).to.equal(0);
            expect(stats.availability.successfulCalls).to.equal(1);

            expect(stats.maxResponseTime).to.equal(500);

            expect(stats.avgResponseTime.value).to.equal(650 / 2);
            expect(stats.avgResponseTime.totTime).to.equal(650);
            expect(stats.avgResponseTime.totNumCalls).to.equal(2);

            expect(stats.responseCodes.count).to.deep.equal({ 200: 1, 400: 1 });
        });

        it('Should return correct statistics with NO oldest value and successfull http call', () => {
            const current = {
                availValue: 1,
                t: 100,
                code: 200
            };

            const stats = statistics._statFactory(current, last);

            expect(stats.availability.value).to.equal(100); /* current fails */
            expect(stats.availability.success).to.equal(1);
            expect(stats.availability.successfulCalls).to.equal(3);

            expect(stats.maxResponseTime).to.equal(200);

            expect(stats.avgResponseTime.value).to.equal(450 / 3);
            expect(stats.avgResponseTime.totTime).to.equal(450);
            expect(stats.avgResponseTime.totNumCalls).to.equal(3);

            expect(stats.responseCodes.count).to.deep.equal({ 200: 3 });
        });

        it('Should return correct statistics with an oldest value and successfull http call', () => {
            statistics._responseTimeQueue.dequeue();

            const current = {
                availValue: 1,
                t: 100,
                code: 200
            };

            const stats = statistics._statFactory(current, last, oldest);

            expect(stats.availability.value).to.equal(100);
            expect(stats.availability.success).to.equal(1);
            expect(stats.availability.successfulCalls).to.equal(2);

            expect(stats.maxResponseTime).to.equal(150);

            expect(stats.avgResponseTime.value).to.equal(250 / 2);
            expect(stats.avgResponseTime.totTime).to.equal(250);
            expect(stats.avgResponseTime.totNumCalls).to.equal(2);

            expect(stats.responseCodes.count).to.deep.equal({ 200: 2 });
        });
    });

    describe('Statistics._updateAll({ success, t, code })', function () {

        let statistics, current, clock, lifetime;

        before(function () {
            lifetime = periods.lookBackTimePeriod[0].lifetime; /* 10mins */
            clock = sinon.useFakeTimers();
        });

        beforeEach(function () {
            statistics = new Statistics(lifetime); /* only the 10min look back time period is tested */
            statistics._responseTimeQueue.enqueue(200); /* old */
            statistics._responseTimeQueue.enqueue(150); /* last */
            statistics._timeQueue.enqueue({
                availability: {
                    value: 100,
                    success: 1,
                    totNumCalls: 1,
                    successfulCalls: 1
                },
                maxResponseTime: 200,
                avgResponseTime: {
                    value: 200,
                    t: 200,
                    totTime: 200,
                    totNumCalls: 1
                },
                responseCodes: {
                    code: 200,
                    count: { 200: 1 }
                }
            });
            statistics._timeQueue.enqueue({
                availability: {
                    value: 100,
                    success: 1,
                    totNumCalls: 2,
                    successfulCalls: 2
                },
                maxResponseTime: 200,
                avgResponseTime: {
                    value: 175,
                    t: 150,
                    totTime: 350,
                    totNumCalls: 2
                },
                responseCodes: {
                    code: 200,
                    count: { 200: 2 }
                }
            });
            current = {
                success: true,
                t: 100,
                code: 200
            };
        });

        it('Should increase timeQueue and responseTimeQueue if the lifetime is NOT exceeded', function () {
            const timeQSize = statistics._timeQueue.size;
            const responseTQSize = statistics._responseTimeQueue.size;

            statistics._updateAllMetrics(current);

            expect(statistics._timeQueue.size).to.be.equal(timeQSize + 1);
            expect(statistics._responseTimeQueue.size).to.be.equal(responseTQSize + 1);
        });

        it('timeQueue and responseTimeQueue should have a constant size if the lifetime IS exceeded', function () {
            const timeQSize = statistics._timeQueue.size;
            const responseTQSize = statistics._responseTimeQueue.size;

            clock.tick(lifetime + 1);

            statistics._updateAllMetrics(current);

            expect(statistics._timeQueue.size).to.be.equal(timeQSize);
            expect(statistics._responseTimeQueue.size).to.be.equal(responseTQSize);
        });
    });
});