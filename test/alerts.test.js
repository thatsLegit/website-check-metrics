const expect = require('chai').expect;
const sinon = require('sinon');

const Alerts = require('../app/website/Alerts');
const { periods } = require('../app/utils/timePeriods');


describe('Alerts', function () {
    describe('Alerts._initStat(availValue, t)', function () {

        let alerts;

        beforeEach(() => {
            alerts = new Alerts(periods.alertPeriod.lifetime); /* 2min */
        });

        it('Should return correct statistics on successful http call', () => {
            const availValue = 1;

            const stats = alerts._initStat(availValue);

            expect(stats.availability.value).to.equal(100);
            expect(stats.availability.success).to.equal(1);
            expect(stats.availability.successfulCalls).to.equal(1);
        });

        it('Should return correct statistics on failed http call', () => {
            const availValue = 0;

            const stats = alerts._initStat(availValue);

            expect(stats.availability.value).to.equal(0);
            expect(stats.availability.success).to.equal(0);
            expect(stats.availability.successfulCalls).to.equal(0);
        });

    });

    describe('Alerts._statFactory(res, last, oldest = null)', function () {

        let alerts;

        beforeEach(() => {
            alerts = new Alerts(periods.alertPeriod.lifetime); /* 2min */
        });

        before(() => {
            oldest = {
                availability: {
                    value: 100,
                    success: 1,
                    totNumCalls: 1,
                    successfulCalls: 1
                }
            };
            last = {
                availability: {
                    value: 100,
                    success: 1,
                    totNumCalls: 2,
                    successfulCalls: 2
                }
            };
        });

        it('Should return correct availability with NO oldest value and failed http call', () => {
            const availValue = 0;

            const alert = alerts._statFactory(availValue, last);

            expect(alert.availability.value).to.equal((2 / 3) * 100); /* current fails */
            expect(alert.availability.success).to.equal(0);
            expect(alert.availability.successfulCalls).to.equal(2);
        });

        it('Should return correct availability with an oldest value and failed http call', () => {
            const availValue = 0;

            const alert = alerts._statFactory(availValue, last, oldest);

            expect(alert.availability.value).to.equal(50); /* current fails */
            expect(alert.availability.success).to.equal(0);
            expect(alert.availability.successfulCalls).to.equal(1);
        });

        it('Should return correct availability with NO oldest value and successfull http call', () => {
            const availValue = 1;

            const alert = alerts._statFactory(availValue, last);

            expect(alert.availability.value).to.equal(100); /* current fails */
            expect(alert.availability.success).to.equal(1);
            expect(alert.availability.successfulCalls).to.equal(3);
        });

        it('Should return correct availability with an oldest value and successfull http call', () => {
            const availValue = 1;

            const alert = alerts._statFactory(availValue, last, oldest);

            expect(alert.availability.value).to.equal(100); /* current fails */
            expect(alert.availability.success).to.equal(1);
            expect(alert.availability.successfulCalls).to.equal(2);
        });
    });

    describe('Alerts._updateAlerts({ success, t })', function () {

        let alert, availValue, clock, lifetime;

        before(function () {
            lifetime = periods.alertPeriod.lifetime; /* 2mins */
            clock = sinon.useFakeTimers();
        });

        beforeEach(function () {
            alert = new Alerts(lifetime);
            alert._timeQueue.enqueue({
                availability: {
                    value: 100,
                    success: 1,
                    totNumCalls: 1,
                    successfulCalls: 1
                }
            });
            alert._timeQueue.enqueue({
                availability: {
                    value: 100,
                    success: 1,
                    totNumCalls: 2,
                    successfulCalls: 2
                }
            });
            availValue = 1; /* current */
        });

        it('Should increase timeQueue if the lifetime is NOT exceeded', function () {
            const timeQSize = alert._timeQueue.size;

            alert._updateAlerts(availValue);

            expect(alert._timeQueue.size).to.be.equal(timeQSize + 1);
        });

        it('timeQueue should have a constant size if the lifetime IS exceeded', function () {
            const timeQSize = alert._timeQueue.size;

            clock.tick(lifetime + 1);

            alert._updateAlerts(availValue);

            expect(alert._timeQueue.size).to.be.equal(timeQSize);
        });
    });
});