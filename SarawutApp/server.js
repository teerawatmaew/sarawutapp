require("dotenv").config();
process.env.PWD = process.cwd()

var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { connect } = require("net");

var app = express();

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/comodo'));
app.use(express.static(process.env.PWD + '/img'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.static(path.join(__dirname, 'public'))); // configure express to use public folder

//<===================>
//<====== index ======>
//<===================>

app.get('/', function (request, response) {
    //var query_target = "announce";
    //connection.query('SELECT * FROM ?', [query_target], function (error, results, fields) {
        //if (results.length > 0) {
            response.render('firstpage.ejs');
        //} else {
            //response.send('Can not open index page.');
        //}
    //});
});

//<===================>
//<====== login ======>
//<===================>

app.post('/loginstudy', function (request, response) {
    var username = request.body.student_number;
    var password = request.body.password;
    connection.query('SELECT * FROM accounts WHERE student_number = ? AND birthdaypass = ?', [username, password], function (error, results, fields) {
        if (results.length > 0) {
            let sess = request.session;
            sess.name = results[0].firstname + " " + results[0].surname;
            sess.student_number = results[0].student_number;
            if (results[0].firstname == 'Sarawut') {
                response.render('./admin/adminindex.ejs', { sess: sess });
            }
            else {
                /*connection.query('SELECT * FROM result WHERE student_number = ?', [username], function (error, results, fields) {
                    if (results.length > 0) {
                        response.render('./user/userindex.ejs', { results: results, sess: sess });
                    } else {
                        response.send('Error 404 data not found.');
                    }
                });*/
                response.render('./user/userindex.ejs', { sess: sess });
            }
        } else {
            response.send('Incorrect Username and/or Password!');
        }
        response.end();
    });
});

app.post('/loginprofile', function (request, response) {
    var username = request.body.student_number;
    var password = request.body.password;
    connection.query('SELECT * FROM accounts WHERE student_number = ? AND birthdaypass = ?', [username, password], function (error, results, fields) {
        if (results.length > 0) {
            response.render('userprofile.ejs', { results: results });
        } else {
            response.send('Error 404 data not found.');
        }
    });
});

app.post('/logincheck', function (request, response) {
    var username = request.body.student_number;
    var password = request.body.password;
    var name;
    connection.query('SELECT * FROM accounts WHERE student_number = ? AND birthdaypass = ?', [username, password], function (error, results, fields) {
        if (results.length > 0) {
            name = results[0].firstname + " " + results[0].surname;
            connection.query('SELECT * FROM result WHERE student_number = ?', [username], function (error, results, fields) {
                if (results.length > 0) {
                    response.render('checkresult.ejs', { results: results, name });
                } else {
                    response.send('Error 404 data not found.');
                }
            });
        } else {
            response.send('Incorrect Username and/or Password!');
        }
    });
});

//=========================== for send session to every page after login ============================
app.use(function (request, response, next) {
    response.locals.sess = request.session;
    next();
});

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

app.get('/session', (request, response) => {
    let sess = request.session;
    console.log(sess);
    response.status(200).send('name = ' + sess.name + '  ' + 'id = ' + sess.student_number);
});


app.get('/logout', function (request, response) {
    request.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        response.redirect('/');
    });
});

//<=====================>
//<====== all api ======>
//<=====================>

const { add_accounts, edit_accounts, delete_accounts, get_accounts, get_accounts_id } = require('./api/v1/accounts');
app.get('/accounts', get_accounts);
app.get('/accounts/(:id)', get_accounts_id);
app.post('/accounts', add_accounts);
app.put('/accounts/(:id)', edit_accounts);
app.delete('/accounts/(:id)', delete_accounts);


app.get('/myprofile', function (request, response) {
    connection.query('SELECT * FROM accounts WHERE username = ?', [request.header.name], function (error, results, fields) {
        if (results.length > 0) response.status(200).json(results);
    });
})

app.post('/announce', function (request, response) {
    var topic = request.body.topic;
    var detail = request.body.detail;
    connection.query('INSERT INTO announce(username,topic,detail,announce_date) VALUE ("�������к�",?,?,NOW())', [topic, detail], function (error, results, fields) {
        if (error) {
            throw error;
        } else {
            response.render('./admin/adminindex.ejs');
        }
    });
});

app.post('/sendreport', function (request, response) {
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
});

app.get('/getscore', function (req, res) {
    // spreadsheet key is the long id in the sheets URL
    //const doc = new GoogleSpreadsheet('<the sheet ID from the url>');
    const doc = new GoogleSpreadsheet('<1e5EMwnGJNzkpCKdXJGR9VdjDDKQxhKWjTYgxwuhcOJc>');

});

//<========================>
//<======= all site =======>
//<========================>

app.get('/loginpage', function (request, response) {
    response.render('login.ejs');
});

app.get('/loginprofile', function (request, response) {
    response.render('loginprofile.ejs');
});

app.get('/logincheckresult', function (request, response) {
    response.render('logincheckresult.ejs');
});

app.get('/report', function (request, response) {
    response.render('report.ejs');
});

app.get('/checkresult', function (request, response) {
    response.render('checkresult.ejs');
});

app.get('/systeminfo', function (request, response) {
    response.render('learningsysteminfo.ejs');
});

app.get('/info', function (request, response) {
    response.render('creatureinfo.ejs');
});

app.get('/userprofile', function (request, response) {
    response.render('userprofile.ejs');
});


//<==========================>
//<======= admin site =======>
//<==========================>

app.get('/adminindex', function (request, response) {
    response.render('./admin/adminindex.ejs');
});
app.get('/managereport', function (request, response) {
    response.render('./admin/managereport.ejs');
});
app.get('/answerreport', function (request, response) {
    response.render('./admin/answerreport.ejs');
});
app.get('/managecourse', function (request, response) {
    response.render('./admin/managecourse.ejs');
});

//<=============================>
//<======= learning site =======>
//<=============================>

app.get('/userindex', function (request, response) {
    response.render('./user/userindex.ejs');
});

app.get('/selectlesson', function (request, response) {
    response.render('./user/selectlesson.ejs');
});

app.get('/pretest', function (request, response) {
    response.render('./lesson/pretest.ejs');
});

app.get('/posttest', function (request, response) {
    response.render('./lesson/posttest.ejs');
});

app.get('/assessmentform', function (request, response) {
    response.render('./lesson/assessmentform.ejs');
});

//======= lesson01 =======
app.get('/detail01', function (request, response) {
    response.render('./lesson/01/detail01.ejs');
});
app.get('/lesson01', function (request, response) {
    response.render('./lesson/01/lesson01.ejs');
});
app.get('/lesson01-firsttest', function (request, response) {
    response.render('./lesson/01/lesson01-firsttest.ejs');
});


app.get('/lesson01-1-work', function (request, response) {
    var random_page = Math.floor(Math.random() * 5) + 1;
    switch (random_page) {
        case 1:
            response.render('./lesson/01/lesson01-1-w1.ejs');
            break;
        case 2:
            response.render('./lesson/01/lesson01-1-w2.ejs');
            break;
        case 3:
            response.render('./lesson/01/lesson01-1-w3.ejs');
            break;
        case 4:
            response.render('./lesson/01/lesson01-1-w4.ejs');
            break;
        case 5:
            response.render('./lesson/01/lesson01-1-w5.ejs');
            break;
        default:
            response.render('./lesson/01/lesson01-1-w1.ejs');
    }
});
/*app.get('/lesson01-1-w1', function (request, response) {
    response.render('./lesson/01/lesson01-1-w1.ejs');
});
app.get('/lesson01-1-w2', function (request, response) {
    response.render('./lesson/01/lesson01-1-w2.ejs');
});
app.get('/lesson01-1-w3', function (request, response) {
    response.render('./lesson/01/lesson01-1-w3.ejs');
});
app.get('/lesson01-1-w4', function (request, response) {
    response.render('./lesson/01/lesson01-1-w4.ejs');
});
app.get('/lesson01-1-w5', function (request, response) {
    response.render('./lesson/01/lesson01-1-w5.ejs');
});
*/
app.get('/lesson01-1-w6', function (request, response) {
    response.render('./lesson/01/lesson01-1-w6.ejs');
});
app.get('/lesson01-1-2', function (request, response) {
    response.render('./lesson/01/lesson01-1-2.ejs');
});
app.get('/lesson01-1-3', function (request, response) {
    response.render('./lesson/01/lesson01-1-3.ejs');
});
app.get('/lesson01-1-3-1', function (request, response) {
    response.render('./lesson/01/lesson01-1-3-1.ejs');
});
app.get('/lesson01-1-3-ask', function (request, response) {
    response.render('./lesson/01/lesson01-1-3-ask.ejs');
});
app.get('/lesson01-secondtest', function (request, response) {
    response.render('./lesson/01/lesson01-secondtest.ejs');
});

app.get('/lesson01-2-1', function (request, response) {
    response.render('./lesson/01/lesson01-2-1.ejs');
});
app.get('/lesson01-2-2', function (request, response) {
    response.render('./lesson/01/lesson01-2-2.ejs');
});
app.get('/lesson01-thirdtest', function (request, response) {
    response.render('./lesson/01/lesson01-thirdtest.ejs');
});

app.get('/lesson01-3-1', function (request, response) {
    response.render('./lesson/01/lesson01-3-1.ejs');
});
app.get('/lesson01-3-2', function (request, response) {
    response.render('./lesson/01/lesson01-3-2.ejs');
});
app.get('/lesson01-3-webboard', function (request, response) {
    response.render('./lesson/01/lesson01-3-webboard.ejs');
});
app.get('/lesson01-3-webboard-1', function (request, response) {
    response.render('./lesson/01/lesson01-3-webboard-1.ejs');
});
app.get('/lesson01-3-webboard-2', function (request, response) {
    response.render('./lesson/01/lesson01-3-webboard-2.ejs');
});
app.get('/lesson01-3-webboard-3', function (request, response) {
    response.render('./lesson/01/lesson01-3-webboard-3.ejs');
});
app.get('/lesson01-3-webboard-4', function (request, response) {
    response.render('./lesson/01/lesson01-3-webboard-4.ejs');
});
app.get('/lesson01-fourthtest', function (request, response) {
    response.render('./lesson/01/lesson01-fourthtest.ejs');
});

app.get('/lesson01-4-1', function (request, response) {
    response.render('./lesson/01/lesson01-4-1.ejs');
});

//======= lesson02 =======
app.get('/detail02', function (request, response) {
    response.render('./lesson/02/detail02.ejs');
});
app.get('/lesson02', function (request, response) {
    response.render('./lesson/02/lesson02.ejs');
});
app.get('/lesson02-1', function (request, response) {
    response.render('./lesson/02/lesson02-1.ejs');
});
app.get('/lesson02-2', function (request, response) {
    response.render('./lesson/02/lesson02-2.ejs');
});
app.get('/lesson02-3', function (request, response) {
    response.render('./lesson/02/lesson02-3.ejs');
});
app.get('/lesson02-3-1', function (request, response) {
    response.render('./lesson/02/lesson02-3-1.ejs');
});
app.get('/lesson02-4', function (request, response) {
    response.render('./lesson/02/lesson02-4.ejs');
});

//======= lesson03 =======
app.get('/detail03', function (request, response) {
    response.render('./lesson/detail03.ejs');
});
app.get('/lesson03', function (request, response) {
    response.render('./lesson/lesson03.ejs');
});
app.get('/lesson03-1', function (request, response) {
    response.render('./lesson/lesson03-1.ejs');
});
app.get('/lesson03-2', function (request, response) {
    response.render('./lesson/lesson03-2.ejs');
});
app.get('/lesson03-3', function (request, response) {
    response.render('./lesson/lesson03-3.ejs');
});
app.get('/lesson03-4', function (request, response) {
    response.render('./lesson/lesson03-4.ejs');
});

//======= lesson04 =======
app.get('/detail04', function (request, response) {
    response.render('./lesson/detail04.ejs');
});
app.get('/lesson04', function (request, response) {
    response.render('./lesson/lesson04.ejs');
});
app.get('/lesson04-1', function (request, response) {
    response.render('./lesson/lesson04-1.ejs');
});
app.get('/lesson04-2', function (request, response) {
    response.render('./lesson/lesson04-2.ejs');
});
app.get('/lesson04-3', function (request, response) {
    response.render('./lesson/lesson04-3.ejs');
});
app.get('/lesson04-4', function (request, response) {
    response.render('./lesson/lesson04-4.ejs');
});

//=======lesson05=======
app.get('/detail05', function (request, response) {
    response.render('./lesson/detail05.ejs');
});
app.get('/lesson05', function (request, response) {
    response.render('./lesson/lesson05.ejs');
});
app.get('/lesson05-1', function (request, response) {
    response.render('./lesson/lesson05-1.ejs');
});
app.get('/lesson05-2', function (request, response) {
    response.render('./lesson/lesson05-2.ejs');
});
app.get('/lesson05-3', function (request, response) {
    response.render('./lesson/lesson05-3.ejs');
});
app.get('/lesson05-4', function (request, response) {
    response.render('./lesson/lesson05-4.ejs');
});

//=======lesson06=======
app.get('/detail06', function (request, response) {
    response.render('./lesson/detail06.ejs');
});
app.get('/lesson06', function (request, response) {
    response.render('./lesson/lesson06.ejs');
});
app.get('/lesson06-1', function (request, response) {
    response.render('./lesson/lesson06-1.ejs');
});
app.get('/lesson06-2', function (request, response) {
    response.render('./lesson/lesson06-2.ejs');
});
app.get('/lesson06-3', function (request, response) {
    response.render('./lesson/lesson06-3.ejs');
});
app.get('/lesson06-4', function (request, response) {
    response.render('./lesson/lesson06-4.ejs');
});

//=======lesson07=======
app.get('/detail07', function (request, response) {
    response.render('./lesson/detail07.ejs');
});
app.get('/lesson07', function (request, response) {
    response.render('./lesson/lesson07.ejs');
});
app.get('/lesson07-1', function (request, response) {
    response.render('./lesson/lesson07-1.ejs');
});
app.get('/lesson07-2', function (request, response) {
    response.render('./lesson/lesson07-2.ejs');
});
app.get('/lesson07-3', function (request, response) {
    response.render('./lesson/lesson07-3.ejs');
});
app.get('/lesson07-4', function (request, response) {
    response.render('./lesson/lesson07-4.ejs');
});

//=======lesson08=======
app.get('/detail08', function (request, response) {
    response.render('./lesson/detail08.ejs');
});
app.get('/lesson08', function (request, response) {
    response.render('./lesson/lesson08.ejs');
});
app.get('/lesson08-1', function (request, response) {
    response.render('./lesson/lesson08-1.ejs');
});
app.get('/lesson08-2', function (request, response) {
    response.render('./lesson/lesson08-2.ejs');
});
app.get('/lesson08-3', function (request, response) {
    response.render('./lesson/lesson08-3.ejs');
});
app.get('/lesson08-4', function (request, response) {
    response.render('./lesson/lesson08-4.ejs');
});

//=======lesson09=======
app.get('/detail09', function (request, response) {
    response.render('./lesson/detail09.ejs');
});
app.get('/lesson09', function (request, response) {
    response.render('./lesson/lesson09.ejs');
});
app.get('/lesson09-1', function (request, response) {
    response.render('./lesson/lesson09-1.ejs');
});
app.get('/lesson09-2', function (request, response) {
    response.render('./lesson/lesson09-2.ejs');
});
app.get('/lesson09-3', function (request, response) {
    response.render('./lesson/lesson09-3.ejs');
});
app.get('/lesson09-4', function (request, response) {
    response.render('./lesson/lesson09-4.ejs');
});

//=======lesson10=======
app.get('/detail10', function (request, response) {
    response.render('./lesson/detail10.ejs');
});
app.get('/lesson10', function (request, response) {
    response.render('./lesson/lesson10.ejs');
});
app.get('/lesson10-1', function (request, response) {
    response.render('./lesson/lesson10-1.ejs');
});
app.get('/lesson10-2', function (request, response) {
    response.render('./lesson/lesson10-2.ejs');
});
app.get('/lesson10-3', function (request, response) {
    response.render('./lesson/lesson10-3.ejs');
});
app.get('/lesson10-4', function (request, response) {
    response.render('./lesson/lesson10-4.ejs');
});

//<================>
// app is on port...
//<================>
app.listen(3200);