var mysql = require('mysql');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});

module.exports = {
    get_my_profile: (request, response) => {
        connection.query('SELECT * FROM accounts WHERE username = ?', [request.header.name], function (error, results, fields) {
            if (results.length > 0) response.status(200).json(results);
        });
    },

    send_report: (request, response) => {
        var firstname = request.body.firstname;
        var surname = request.body.surname;
        var topic = request.body.topic;
        var detail = request.body.detail;
        if (request.body.image) {
            var image = request.body.image;
            connection.query('INSERT INTO report(firstname,surname,topic,image,detail,state) VALUES(?,?,?,?,?,0)', [firstname, surname, topic, image, detail], function (error, results, fields) {
                if (error) {
                    response.send('Can not sent your report. Please try again later...');
                } else {
                    response.render('firstpage.ejs');
                }
                response.end();
            });
        } else {
            connection.query('INSERT INTO report(firstname,surname,topic,detail,state) VALUES(?,?,?,?,0)', [firstname, surname, topic, detail], function (error, results, fields) {
                if (results.length > 0) {
                    response.send('Can not sent your report. Please try again later...');
                } else {
                    response.render('firstpage.ejs');
                }
                response.end();
            });
        }
    }
}