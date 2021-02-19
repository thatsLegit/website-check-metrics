exports.periods = {
    publishRates: [{publish: 1000*10}, {publish: 1000*6*10}], /* 10sec and 1min */
    lookBackTimePeriod: [{lifetime: 1000*6*10*10}, {lifetime: 1000*6*10*10*6}], /* 10min and 1hour */
    alertPeriod: {lifetime: 1000*6*10*2} /* 2min */
}