require("dotenv").config();
process.env.PWD = process.cwd()

var mysql = require('mysql');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');

var app = express();

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});

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

app.get('/index', function (request, response) {
    response.render('firstpage.ejs');
});

app.get('/loginpage', function (request, response) {
    response.render('login.ejs');
});

app.get('/report', function (request, response) {
    response.render('report.ejs');
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