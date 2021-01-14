var mysql = require('mysql');

var connection = mysql.createPool({
    connectionLimit: 1000,
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});

module.exports = {
    get_accounts: (request, response) => {
        connection.query('SELECT * FROM accounts', function (error, results, fields) {
            if (error) {
                throw err;
            } else {
                response.status(200).json(results);
            }
        });
    },

    get_accounts_id: (request, response) => {
        var student_number = request.params.id;
        connection.query('SELECT * FROM accounts WHERE student_number = ?', [student_number], function (error, results, fields) {
            if (error) {
                throw err;
            } else {
                response.status(200).json(results);
            }
        });
    },

    add_accounts: (request, response) => {
        var student_number = request.body.student_number;
        var birthdaypass = request.body.birthdaypass;
        var firstname = request.body.firstname;
        var surname = request.body.surname;
        connection.query('SELECT * FROM accounts WHERE student_number = ?', [student_number], function (error, results, fields) {
            if (results.length > 0) {
                response.send('This student number is already exists.');
            } else {
                connection.query('INSERT INTO accounts(student_number, birthdaypass, firstname, surname) VALUES(?,?,?,?)', [student_number, birthdaypass, firstname, surname], (err, result) => {
                    if (err) {
                        throw err;
                    } else {
                        response.status(200).send('Success to insert new data.');
                    }
                });
            }
        });
    },

    edit_accounts: (request, response) => {
        var student_number = request.params.id;
        var birthdaypass = request.body.birthdaypass;
        var firstname = request.body.firstname;
        var surname = request.body.surname;
        connection.query('SELECT * FROM accounts WHERE student_number = ?', [student_number], function (error, results, fields) {
            if (results.length > 0) {
                response.send('This student number is already exists.');
            } else {
                connection.query('UPDATE accounts SET birthdaypass=?, firstname=?, surname=? WHERE student_number=?)', [birthdaypass, firstname, surname, student_number], (err, result) => {
                    if (err) {
                        throw err;
                    } else {
                        response.status(200).send('Success to insert new data.');
                    }
                });
            }
        });
    },

    delete_accounts: (request, response) => {
        var student_number = request.params.id;
        connection.query('DELETE FROM accounts WHERE student_number = ?', [student_number], function (error, results, fields) {
            if (error) {
                throw err;
            } else {
                response.status(200).send('Success to delete data.');
            }
        });
    }
}