let cas = require('byu-cas');
let mysql = require('mysql');
let config = require('../routes/config');
let location = config.getLocation();
let URL = config.getURL();
const axios = require('axios');
let cookiee = require('cookie-encryption');
let vault = cookiee('ciao', {
    maxAge: 43200000
});

class Database {
    constructor(config) {
        this.connection = mysql.createConnection(config);
    }

    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
}


function checkUser(user) {
    if (location === '/inventory') {
        for (let i in user.memberOf) {
            if (user.memberOf[i] === 'RICHARD_CROOKSTON--RBC9') {
                return true;
            }
        }
        return false;
    }
    else {
        let possiblities = ['mmcourt', 'bquinlan', 'rbc9', 'mr28'];
        for (let i in possiblities) {
            if (possiblities[i] === user.netId) {
                return true;
            }
        }
        return false;
    }

}

module.exports = function (req, res, next) {
    if (req.path === '/getTicket') {
        let ticket = req.query.ticket;
        let goTo = req.query.goTo;
        // console.log("goto2: " + goTo);
        let service = URL + '/getTicket?goTo=' + goTo;
        let user = '';
        if (goTo = '') {
            goTo = '/'
        }
        let query = req.query;
        cas.validate(ticket, service)
            .then(function success(response) {
                console.log("Ticket valid! Hello, " + response.username);
                user = response.attributes;
            })
            .then(() => {
                if (checkUser(user)) {
                    let goTo = req.query.goTo;
                    let json = JSON.stringify(user);
                    let defaultComputerShowOptions = {
                        "ICN": true,
                        "FirstName": true,
                        "LastName": true,
                        "Make": true,
                        "Model": true,
                        "SerialNumber": false,
                        "ServiceTag": false,
                        "ExpressServiceCode": false,
                        "Type": true,
                        "DateAcquired": true,
                        "Warranty": true,
                        "HomeCheckout": false,
                        "Touch": false,
                        "ScreenResolution": false,
                        "Rotation": true,
                        "Notes": true,
                        "History": false,
                        "ProcessorType": false,
                        "ProcessorSpeed": false,
                        "Memory": false,
                        "HardDrive": false,
                        "VCName": false,
                        "Surplussing": false
                    };
                    let defaultMonitorShowOptions = {
                        "ICN": true,
                        "FirstName": true,
                        "LastName": true,
                        "Make": true,
                        "Model": true,
                        "SerialNumber": false,
                        "DateAcquired": true,
                        "Warranty": true,
                        "HomeCheckout": false,
                        "Notes": true,
                        "History": false,
                        "Surplussing": false
                    };
                    let defaultPrinterShowOptions = {
                        "ICN": true,
                        "FirstName": true,
                        "LastName": true,
                        "Make": true,
                        "Model": true,
                        "SerialNumber": false,
                        "DateAcquired": true,
                        "Warranty": true,
                        "HomeCheckout": false,
                        "Notes": true,
                        "History": false,
                        "Surplussing": false
                    };
                    let defaultPeripheralShowOptions = {
                        "ICN": true,
                        "FirstName": true,
                        "LastName": true,
                        "Make": true,
                        "Model": true,
                        "Item": true,
                        "SerialNumber": false,
                        "DateAcquired": true,
                        "Warranty": true,
                        "HomeCheckout": false,
                        "Notes": true,
                        "History": false,
                        "Surplussing": false
                    };
                    let database = new Database(config.getConfig());
                    database.query('SELECT * FROM Filters WHERE user = \'' + user.netId + '\'')
                        .then(rows => {
                            if (rows.length === 0) {
                                return database.query('INSERT INTO Filters (user, filters, monitorFilters, printerFilters, peripheralFilters, computerShowOptions, monitorShowOptions, printerShowOptions, peripheralShowOptions) VALUES (?,?,?,?,?,?,?,?,?)', [user.netId, '', '', '', '', JSON.stringify(defaultComputerShowOptions), JSON.stringify(defaultMonitorShowOptions), JSON.stringify(defaultPrinterShowOptions), JSON.stringify(defaultPeripheralShowOptions)])
                            }
                        })
                        .then(rows => {
                            database.close();
                            vault.write(req, json);
                            res.redirect(URL + goTo);
                        })
                        .catch(err => {
                            console.log(err);
                        })

                }
                else {
                    res.render('login');
                }
            })
            .catch(function error(e) {
                console.log("Invalid ticket. Error message was: " + e.message);
                // res.redirect(location + '/login');
            });
    }
    else {
        let cookie = vault.read(req);
        if (cookie === "") {
            let parameters = '';
            let query = req.query;
            let goTo = req.originalUrl;
            for (let i in query) {
                console.log(i);
                console.log(query[i]);
                parameters += '?' + i + '=' + query[i];
            }
            res.redirect('https://cas.byu.edu/cas/login?service=' + encodeURIComponent(URL + '/getTicket?goTo=' + goTo));
        }
        else {
            next();
        }
    }

};
