const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const {metrics} = require('./utils/metrics');

// This is not required in the assignement but I thought it would be a good idea to keep a trace of 
// all logs in a csv format.

class History {
    constructor() {
        this._header = [
            {id: 'url', title: 'url'}, 
            {id: 'type', title: 'type'},
            {id: 'state', title: 'state'},
            {id: 'time', title: 'time'}
        ];
        this._Init();
    }

    _Init() {
        for (const m of metrics) {
            this._header.push({id: m.id, title: m.title});
        }
        this._csvWriter = createCsvWriter({ path: 'history.csv', header: this._header });
    }

    _writeCSV(data) {
        this._csvWriter.writeRecords([{
            url: data.url,
            type: data.type,
            state: data.state,
            time: new Date(),
            Availability: (data.state == 'up' && data.type == 'stats') ? data.stats.availability : '-',
            MaximumResponseTime: (data.state == 'up' && data.type == 'stats') ?  data.stats.maxResponseTime : '-',
            AverageResponseTime: (data.state == 'up' && data.type == 'stats') ?  data.stats.avgResponseTime : '-',
            ObservedResponseCodes: (data.state == 'up' && data.type == 'stats') ?  JSON.stringify(data.stats.responseCodes) : '-'
        }]);
    }
}

module.exports = History;