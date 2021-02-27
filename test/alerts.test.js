const assert = require('chai').assert;
const Memory = require('../app/website/Memory');

const {periods} = require('../app/utils/timePeriods');

const FakeTimers = require("@sinonjs/fake-timers");
const clock = FakeTimers.createClock();

// alerts logic:
// -> Website.check() 
// -> memory._refreshAlerts(data) !TEST
// -> Alerts._update_availability(data)
// -> Website._stateMachine.Update(alert)
// -> currentState.update(alert)
    // currentState 'up'?
        // -> if availability < 80, this._stateMachine.SetState('down', alert)
        // -> currentState.Exit(alert)
        // -> newState.Enter(alert)
        // -> emits 'publish_alert'(alert)
        // -> Presentation.displayAlert(alert)
    // currentState 'down' ?
        // -> if !availability > 80, this._stateMachine.SetState('up', alert)
        // -> currentState.Exit(alert)
        // -> emits 'publish_alert_resumed'(alert)
        // -> Presentation.displayAlertResumed(alert)
        // -> newState.Enter(alert)

// ? My strategy in testing alerts: 

// ? Unit testing the beginning of the alert trigger chain:
// ? memory._refreshAlerts: converts received data from http calls to availability stats for the past 2mins
// ? I am testing the returned data type as well as the correctness of its value.

// ? To me it didn't make sense to test all the following functions as there role is consisting in updating states
// ? according to the generated states, emit events and finally display the alert, if there's any, to the console.

describe('Alerts', function() {
    describe('Memory._refreshAlerts(data)', function() {

        it('refreshAlerts() must return an Object', function() {
            const memory = new Memory({
                statistics: [periods.lookBackTimePeriod[0]],
                alert: periods.alertPeriod,
            }); /* Only one of the look-back-time period (10min) is taken into account here to keep things simple */

            const res = memory._refreshAlerts({
                success: true,
                t: 100,
                code: 200
            });

            assert.typeOf(res, 'object');
        }); 

        it('In the returned object properties, date: Date, availability: Number', function() {
            const memory = new Memory({
                statistics: [periods.lookBackTimePeriod[0]],
                alert: periods.alertPeriod,
            }); /* params for the stats with a look back of 10mins and 2mins for alerts */

            const res = memory._refreshAlerts({
                success: true,
                t: 100,
                code: 200
            });

            assert.instanceOf(res.date, Date);
            assert.typeOf(res.availability, 'number');
        });

        it('Computing availability over multiple successful/failed calls, taking time into consideration ', function() {
            /* Test: 20 succesful calls then 5 failed then 5 succesful should give ~83% availability */

            const memory = new Memory({
                statistics: [periods.lookBackTimePeriod[0]],
                alert: periods.alertPeriod,
            }); /* params for the stats with a look back of 10mins and 2mins for alerts */
            const interval = 1500; /* website check interval time in ms */

            let success = true, count = 0;
            let launchTest = clock.setInterval(function () {
                memory._refreshAlerts({
                    success,
                    t: 100,
                    code: 200
                });

                count++;
                if(count == 20) success = false;
                if(count == 25) success = true;
            }, interval);

            clock.setTimeout(() => {
                clearInterval(launchTest);
                assert.equal(memory._alert.Alert.availability, (5/6)*100);
            }, interval*30);

            clock.tick(interval*30);
        });
    });
});