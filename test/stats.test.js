const assert = require('chai').assert;
const Memory = require('../app/website/Memory');

const {periods} = require('../app/utils/timePeriods');

const FakeTimers = require("@sinonjs/fake-timers");
const clock = FakeTimers.createClock();

// stats logic:
// -> Website.check() 
// -> memory._refreshAllMetrics(data) !TEST
// -> Stats._updateAll(data)
// -> Every periods.publishRate, latest stats are extracted from the Website by the Controller
// -> commonEmitter.emit('publish_stats', data);
// -> Presentation._displayStats(data)

// ? The logic is shorter than for alets but the testing approach is the same:
// ? Only the beginning of the chain is tested deeply, as it contains most of the logic
// ? The purpose of the rest of the chain is to propagate the data to the presentation part

describe('Stats', function() {
    describe('Memory._refreshAllMetrics(data)', function() {

        it('refreshAllMetrics() must return an Object', function() {
            const memory = new Memory({
                statistics: [periods.lookBackTimePeriod[0]],
                alert: periods.alertPeriod,
            }); /* Only one of the look-back-time period (10min) is taken into account here to keep things simple */

            const res = memory._refreshAllMetrics({
                success: true,
                t: 100,
                code: 200
            });
            assert.typeOf(res, 'object');
        }); 

        it("Checking the type of the returned object's properties", function() {
            const memory = new Memory({
                statistics: [periods.lookBackTimePeriod[0]],
                alert: periods.alertPeriod,
            }); /* params for the stats with a look back of 10mins and 2mins for alerts */

            const res = memory._refreshAllMetrics({
                success: true,
                t: 100,
                code: 200   
            });

            assert.typeOf(res.upTime, 'number');
            assert.typeOf(res.lifetime, 'number');
            assert.typeOf(res.availability, 'number');
            assert.typeOf(res.maxResponseTime, 'number');
            assert.typeOf(res.avgResponseTime, 'number');
            assert.typeOf(res.responseCodes, 'object');
        });

        it('Checking metrics precision over multipe http calls', function() {
            /* Test: 20 succesful calls then 5 failed */

            const memory = new Memory({
                statistics: [periods.lookBackTimePeriod[0]],
                alert: periods.alertPeriod,
            }); /* params for the stats with a look back of 10mins and 2mins for alerts */
            const interval = 1500; /* website check interval time in ms */

            let success = true, count = 0;
            let launchTest = clock.setInterval(function () {
                memory._refreshAllMetrics({
                    success,
                    t: 100,
                    code: success ? 200 : 500
                });

                count++;
                if(count == 20) success = false;
            }, interval);

            clock.setTimeout(() => {
                clearInterval(launchTest);
                const latestStats = memory._stats[0].stats;

                assert.equal(latestStats.upTime, 0);
                assert.equal(latestStats.availability, 80);
                assert.equal(latestStats.maxResponseTime, 100);
                assert.equal(latestStats.avgResponseTime, 100);
                assert.equal(JSON.stringify(latestStats.responseCodes), JSON.stringify({200: 20, 500: 5}));
            }, interval*25);

            clock.tick(interval*25);
        });
    });
});
