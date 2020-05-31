require("dotenv").config();
process.env.PWD = process.cwd()

var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

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
    var username = request.body.username;
    var password = request.body.password;
    connection.query('SELECT * FROM accounts WHERE student_number = ? AND birthdaypass = ?', [username, password], function (error, results, fields) {
        if (results.length > 0) {
            request.session.loggedin = true;
            request.session.username = username;
            response.send('Welcome back Student');
        } else {
            response.send('Incorrect Username and/or Password!');
        }
        response.end();
    });
});


app.get('/logout', function (request, response) {
    response.redirect('/');
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

app.get('/viewreport', function (request, response) {
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

app.get('/detail02', function (request, response) {
    response.render('./lesson/detail02.ejs');
});
app.get('/detail03', function (request, response) {
    response.render('./lesson/detail03.ejs');
});
app.get('/detail04', function (request, response) {
    response.render('./lesson/detail04.ejs');
});
app.get('/detail05', function (request, response) {
    response.render('./lesson/detail05.ejs');
});
app.get('/detail06', function (request, response) {
    response.render('./lesson/detail06.ejs');
});
app.get('/detail07', function (request, response) {
    response.render('./lesson/detail07.ejs');
});
app.get('/detail08', function (request, response) {
    response.render('./lesson/detail08.ejs');
});
app.get('/detail09', function (request, response) {
    response.render('./lesson/detail09.ejs');
});
app.get('/detail10', function (request, response) {
    response.render('./lesson/detail10.ejs');
});


app.get('/lesson02', function (request, response) {
    response.render('./lesson/lesson02.ejs');
});
app.get('/lesson03', function (request, response) {
    response.render('./lesson/lesson03.ejs');
});
app.get('/lesson04', function (request, response) {
    response.render('./lesson/lesson04.ejs');
});
app.get('/lesson05', function (request, response) {
    response.render('./lesson/lesson05.ejs');
});
app.get('/lesson06', function (request, response) {
    response.render('./lesson/lesson06.ejs');
});
app.get('/lesson07', function (request, response) {
    response.render('./lesson/lesson07.ejs');
});
app.get('/lesson08', function (request, response) {
    response.render('./lesson/lesson08.ejs');
});
app.get('/lesson09', function (request, response) {
    response.render('./lesson/lesson09.ejs');
});
app.get('/lesson10', function (request, response) {
    response.render('./lesson/lesson10.ejs');
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