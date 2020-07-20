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
    response.render('firstpage.ejs');
});

//<===================>
//<====== login ======>
//<===================>

app.post('/login', function (request, response) {
    var username = request.body.student_number;
    var password = request.body.password;
    connection.query('SELECT * FROM accounts WHERE student_number = ? AND birthdaypass = ?', [username, password], function (error, results, fields) {
        if (results.length > 0) {
            let sess = request.session;
            sess.name = results[0].firstname + " " + results[0].surname;
            sess.student_number = results[0].student_number;
            response.render('./user/userindex.ejs', { sess: sess });
        } else {
            response.send('Incorrect Username and/or Password!');
        }
        response.end();
    });
});

app.use(function (request, response, next) {
    response.locals.sess = request.session;
    next();
});

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

app.get('/myprofile', function (request, response) {
    connection.query('SELECT * FROM accounts WHERE username = ?', [request.header.name], function (error, results, fields) {
        if (results.length > 0) response.status(200).json(results);
    });
})

app.get('/user', function (request, response) {
    connection.query('SELECT * FROM accounts', (err, results) => {
        if (err) {
            throw err;
            response.status(404);
        }
        else {
            response.status(200).json(results);
        }
    });
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

app.get('/report', function (request, response) {
    response.render('report.ejs');
});

app.get('/checkresult', function (request, response) {
    response.render('checkresult.ejs');
});

app.get('/answerreport', function (request, response) {
    response.render('answerreport.ejs');
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
app.get('/lesson01-1', function (request, response) {
    response.render('./lesson/01/lesson01-1.ejs');
});
app.get('/lesson01-2', function (request, response) {
    response.render('./lesson/01/lesson01-2.ejs');
});
app.get('/lesson01-3', function (request, response) {
    response.render('./lesson/01/lesson01-3.ejs');
});
app.get('/lesson01-3-1', function (request, response) {
    response.render('./lesson/01/lesson01-3-1.ejs');
});
app.get('/lesson01-4', function (request, response) {
    response.render('./lesson/01/lesson01-4.ejs');
});
app.get('/lesson01-5', function (request, response) {
    response.render('./lesson/01/lesson01-5.ejs');
});
app.get('/lesson01-6', function (request, response) {
    response.render('./lesson/01/lesson01-6.ejs');
});
app.get('/lesson01-7', function (request, response) {
    response.render('./lesson/01/lesson01-7.ejs');
});
app.get('/lesson01-8', function (request, response) {
    response.render('./lesson/01/lesson01-8.ejs');
});
app.get('/lesson01-9', function (request, response) {
    response.render('./lesson/01/lesson01-9.ejs');
});
app.get('/lesson01-10', function (request, response) {
    response.render('./lesson/01/lesson01-10.ejs');
});
app.get('/lesson01-11', function (request, response) {
    response.render('./lesson/01/lesson01-11.ejs');
});
app.get('/lesson01-12', function (request, response) {
    response.render('./lesson/01/lesson01-12.ejs');
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

app.get('/admin-profile.ejs', function (request, response) {
    connection.query('SELECT * FROM accounts WHERE id = 1', (err, results) => {
        if (err) {
            throw err;
        }
        else {
            var accounts = results;
            response.render('admin-profile.ejs', { accounts: accounts });
        }
    });
});

//<================>
// app is on port...
//<================>
app.listen(3200);