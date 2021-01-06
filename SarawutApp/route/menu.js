var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});

module.exports = {
    login: (request,response) => {
        response.render('login.ejs');
    },

    loginprofile: (request,response) => {
        response.render('loginprofile.ejs');
    },

    logincheckresult: (request,response) => {
        response.render('logincheckresult.ejs');
    },

    report: (request, response) => {
        response.render('report.ejs');
    },

    checkresult: (request, response) => {
        response.render('checkresult.ejs');
    },

    systeminfo: (request, response) => {
        response.render('learningsysteminfo.ejs');
    },

    info: (request, response) => {
        response.render('creatureinfo.ejs');
    },

    userprofile: (request, response) => {
        response.render('userprofile.ejs');
    },

    qa: (request, response) => {
        connection.query('SELECT * FROM report WHERE state = 1', function (error, results, fields) {
            if (results.length > 0) {
                var report = results;
            } else {
                var report = [{
                    firstname: 'no data',
                    surname: 'no data',
                    topic: 'no data',
                    detail: 'no data',
                    answer: 'no data'
                }];
            }
            response.render('qa.ejs', { report: report });
        });
    }
}