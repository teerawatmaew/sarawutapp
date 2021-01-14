var mysql = require('mysql');

var connection = mysql.createPool({
    connectionLimit: 1000,
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});

module.exports = {
    post_announce: (request, response) => {
        var topic = request.body.topic;
        var detail = request.body.detail;
        connection.query('INSERT INTO announce(username,topic,detail,announce_date) VALUE ("Administrator",?,?,NOW())', [topic, detail], function (error, results, fields) {
            if (error) {
                throw err;
            } else {
                response.render('./admin/adminindex.ejs');
            }
        });
    },

    set_lesson: (request, response) => {
        var lesson = request.body.lessonstate;
        connection.query('UPDATE controller SET currentstate=? WHERE id=1', [lesson], function (error, results, fields) {
            if (error) {
                throw err;
            } else {
                response.render('./admin/adminindex.ejs');
            }
        });
    }
}