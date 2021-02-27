require('colors');
const readline = require('readline');

const commonEmitter = require('./app/utils/events_common');

const Controller = require('./app/Controller');
const Presentation = require('./app/Presentation');
const History = require('./app/History');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(function askInput(first, userInput) {
    rl.question(`Add ${first ? 'a' : 'another'} website (y or n)?`, answer => {
        if (answer.match(/^y(es)?$/i)) {
            rl.question('Enter the url of the website : ', url => {
                console.log(url.cyan);
                if(!url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/)) throw new Error('Invalid url entered.'.red);
                rl.question('Enter the check interval for this website in miliseconds (between 1000 and 10000) : ', interval => {
                    console.log(interval.cyan);
                    if (interval > 10000 || interval < 1000) throw new Error('the check interval must be between 1000 and 10000ms'.red)
                    userInput.push({url, interval});
                    askInput(false, userInput);
                });
            });
        } 
        else if (answer.match(/^n(o)?$/i)) {
            rl.close();
            userInput.length && startApp(userInput);
        }
        else askInput(false, userInput);
    });
})(true, []);


function startApp(userInput) {
    new Controller(userInput);
    const presentation = new Presentation(userInput);
    const history = new History();

    commonEmitter.addListener('publish_stats', data => {
        presentation._displayStats(data);
        history._writeCSV({
            ...data,
            type: 'stats',
            state: 'up'
        });
    }); 
    commonEmitter.addListener('publish_alert', data => {
        presentation._displayAlert(data);
        history._writeCSV({
            ...data,
            type: 'alert',
            state: 'down'
        });
    });
    commonEmitter.addListener('publish_alert_resumed', data => {
        presentation._displayAlertResumed(data);
        history._writeCSV({
            ...data,
            type: 'alert',
            state: 'up'
        });
    });
}

