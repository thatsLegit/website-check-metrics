require('colors');

class Presentation {
    constructor(input) {
        this._input = input;
        this._Init();
    }
    
    _Init() {
        console.log('Monitoring started !'.cyan);
        for (let elem of this._input) {
            console.log(`Monitoring ${elem.url} every ${elem.interval}ms`.green);
        }
    }
    _displayStats(data) {
        console.log(`${data.url} metrics for the past ${data.period / 1000} minutes:`.cyan);
        console.log(`Availability: ${data.stats.availability}%`);
        console.log(`Maximum response time: ${data.stats.maxResponseTime}ms`);
        console.log(`Average response time: ${data.stats.avgResponseTime}ms`);
        console.log('Observed response codes:', JSON.stringify(data.stats.responseCodes));
        console.log('#######################################################################'.rainbow);
    }
    _displayAlert(data) {
        console.log(`The website at ${data.url} is down ! Availability: ${data.availability}, time: ${data.date}`.yellow);
    }
    _displayAlertResumed(data) {
        console.log(`The website at ${data.url} has recovered ! Availability: ${data.availability}, time: ${data.date}`.yellow);
    }
}

module.exports = Presentation;