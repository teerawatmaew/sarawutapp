var mysql = require('mysql');

var connection = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});

module.exports = {
    adminindex: (request, response) => {
        response.render('./admin/adminindex.ejs');
    },

    managereport: (request, response) => {
        response.render('./admin/managereport.ejs');
    },

    answerreport: (request, response) => {
        response.render('./admin/answerreport.ejs');
    },

    managecourse: (request, response) => {
        response.render('./admin/managecourse.ejs');
    },

    addaccounts: (request, response) => {
        var id = request.body.id;
        var password = request.body.password;
        var name = request.body.name;
        var surname = request.body.surname;
        connection.query('INSERT INTO accounts VALUE (?,?,?,?)', [id, password, name, surname], function (error, results, fields) {
            connection.query('INSERT INTO result VALUE (?,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)', [id], function (error, results, fields) {
                response.render('./admin/adminindex.ejs');
            });
        });
    }
}