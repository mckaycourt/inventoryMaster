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
    } else {
        let possiblities = ['mmcourt', 'bquinlan', 'rbc9', 'mr28', 'rmw78'];
        for (let i in possiblities) {
            if (possiblities[i] === user.netId) {
                return true;
            }
        }
        return false;
    }
}

function checkUserUpdated(user) {
    if (location === '/inventory') {
        for (let i in user.memberOf) {
            if (user.memberOf[i] === 'RICHARD_CROOKSTON--RBC9') {
                return true;
            } else if (user.memberOf[i] !== 'RICHARD_CROOKSTON--RBC9') {
                let possiblities = ['mmcourt', 'jking793', 'rbc9', 'pdiaz3', 'kroosa', 'twilks', 'mft17'];
                //added myself and current employees in here, i don't think any of of the others are still working here besides rbc9
                for (let i in possiblities) {
                    if (possiblities[i] === user.netID) {
                        return true;
                    }
                }
            } else {
                return false;
            }
        }
    }
}

module.exports = function(req, res, next) {
    if (req.path === '/getTicket') {
        let ticket = req.query.ticket;
        let goTo = req.query.goTo;
        // console.log("goto2: " + goTo);
        let service = URL + '/getTicket?goTo=' + goTo;
        let user = '';
        if (goTo === '') {
            goTo = '/'
        }
        let query = req.query;
        cas.validate(ticket, service)
            .then(function success(response) {
                console.log("Ticket valid! Hello, " + response.username);
                user = response.attributes;
            })
            .then(() => {
                if (checkUserUpdated(user)) {
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
                        "RotationGroup": true,
                        "Notes": true,
                        "History": false,
                        "ProcessorType": false,
                        "ProcessorSpeed": false,
                        "Memory": false,
                        "HardDrive": false,
                        "VCName": false,
                        "MAX(Inventory.CurrentDate)": true,
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
                        "MAX(Inventory.CurrentDate)": true,
                        "Surplussing": false
                    };
                    let defaultPrinterShowOptions = {
                        "ICN": true,
                        "LesOlsonID": true,
                        "FirstName": true,
                        "LastName": true,
                        "Make": false,
                        "Model": true,
                        "Building": true,
                        "Office": true,
                        "SerialNumber": false,
                        "DateAcquired": true,
                        "Warranty": false,
                        "Notes": false,
                        "History": false,
                        "MAX(Inventory.CurrentDate)": true,
                        "Max(PageCounts.PageCount)": true,
                        "AddPageCount": false,
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
                        "MAX(Inventory.CurrentDate)": true,
                        "Surplussing": false
                    };
                    let test = config.getConfig();
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

                } else {
                    res.render('login');
                }
            })
            .catch(function error(e) {
                console.log("Invalid ticket. Error message was: " + e.message);
                // res.redirect(location + '/login');
            });
    } else {
        let cookie = vault.read(req);
        if (req.path === '/email') {
            next();
        } else if (cookie === "") {
            let parameters = '';
            let query = req.query;
            let goTo = req.originalUrl;
            for (let i in query) {
                console.log(i);
                console.log(query[i]);
                parameters += '?' + i + '=' + query[i];
            }
            res.redirect('https://cas.byu.edu/cas/login?service=' + encodeURIComponent(URL + '/getTicket?goTo=' + goTo));
        } else {
            next();
        }
    }

};