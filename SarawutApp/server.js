//require("dotenv").config();
process.env.PWD = process.cwd()

var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');

const { google } = require('googleapis');
const sheets = google.sheets('v4');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { connect } = require("net");

var app = express();
/*var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});*/
//socketPath: '/cloudsql/maenlms:asia-southeast1:root'
var connection = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'lms'
});

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000*20 }
}))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/comodo'));
app.use(express.static(process.env.PWD + '/img'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.static(path.join(__dirname, 'public'))); // configure express to use public folder

var json_no_datasheet = [{ sheet: '1', student_number: 'No data', username: 'No data', detail: 'No data'}, 
    { sheet: '2',student_number: 'No data',username: 'No data',detail: 'No data'},
    { sheet: '3', student_number: 'No data', username: 'No data', detail: 'No data' },
    { sheet: '4', student_number: 'No data', username: 'No data', detail: 'No data' },
    { sheet: '5', student_number: 'No data', username: 'No data', detail: 'No data' },
    { sheet: '6', student_number: 'No data', username: 'No data', detail: 'No data' },
    { sheet: '7', student_number: 'No data', username: 'No data', detail: 'No data' },
    { sheet: '8', student_number: 'No data', username: 'No data', detail: 'No data' },
    { sheet: '9', student_number: 'No data', username: 'No data', detail: 'No data' },
    { sheet: '10', student_number: 'No data', username: 'No data', detail: 'No data' }
];

function random_workpage(lesson, state, pagefirst, pagelast) {
    var range = pagelast - pagefirst + 1; //number
    var random_number = Math.floor(Math.random() * range) + pagefirst;
    var url = './lesson/0' + lesson + '/lesson0' + lesson + '-' + state + '-w' + random_number + '.ejs';
    return (url);
}

//<===================>
//<====== index ======>
//<===================>

app.get('/', function (request, response) {
    response.render('firstpage.ejs');
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
                response.render('./user/successlogin.ejs', { sess: sess });
            }
        } else {
            response.send('Incorrect Username and/or Password!');
        }
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

//<========================>
//<======= all menu =======>
//<========================>
const { login, loginprofile, logincheckresult, report, checkresult, systeminfo, info, userprofile, qa } = require('./route/menu');
app.get('/login', login);
app.get('/loginprofile', loginprofile);
app.get('/logincheckresult', logincheckresult);
app.get('/report', report);
app.get('/checkresult', checkresult);
app.get('/systeminfo', systeminfo);
app.get('/info', info);
app.get('/userprofile', userprofile);
app.get('/QA', qa);

//<=====================>
//<====== all api ======>
//<=====================>
const { add_accounts, edit_accounts, delete_accounts, get_accounts, get_accounts_id } = require('./api/v1/accounts');
app.get('/accounts', get_accounts);
app.get('/accounts/(:id)', get_accounts_id);
app.post('/accounts', add_accounts);
app.put('/accounts/(:id)', edit_accounts);
app.delete('/accounts/(:id)', delete_accounts);

const { post_announce, set_lesson } = require('./api/v1/admin_action');
app.post('/post-announce', post_announce);
app.post('/set-lesson', set_lesson);

const { get_my_profile, send_report } = require('./api/v1/user');
app.get('/myprofile', get_my_profile);
app.post('/sendreport', send_report);

//<==========================>
//<======= admin site =======>
//<==========================>
const { adminindex, managereport, answerreport, managecourse, addaccounts } = require('./route/adminmenu');
app.get('/adminindex', adminindex);
app.get('/managereport', managereport);
app.get('/answerreport', answerreport);
app.get('/managecourse', managecourse);
app.post('/addaccounts', addaccounts);

app.get('/manage01', function (request, response) {
    response.render('./admin/manage01.ejs');
});

app.get('/manage01-1', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 1', function (error, results, fields) {
        if (error) {
            throw (error);
        } else {
            response.render('./admin/manage01-1.ejs', { result: results });
        }
    });
});
app.get('/manage01-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 2', function (error, results, fields) {
        if (error) {
            throw (error);
        } else {
            response.render('./admin/manage01-2.ejs', { result: results });
        }
    });
});
app.get('/manage01-3', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 3', function (error, results, fields) {
        if (error) {
            throw (error);
        } else {
            response.render('./admin/manage01-3.ejs', { result: results });
        }
    });
});
app.get('/manage01-4', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 4', function (error, results, fields) {
        if (error) {
            throw (error);
        } else {
            response.render('./admin/manage01-4.ejs', { result: results });
        }
    });
});

app.post('/addworkscore/(:id)/(:lesson)', function (request, response) {
    var id = request.params.id;
    var lesson = request.params.lesson;
    var score = request.body.score;
    var work_target;
    if (lesson == 1) { work_target = "work01"; }
    else if (lesson == 2) { work_target = "work02"; }
    else if (lesson == 3) { work_target = "work03"; }
    else if (lesson == 4) { work_target = "work04"; }
    else if (lesson == 5) { work_target = "work05"; }
    else if (lesson == 6) { work_target = "work06"; }
    else if (lesson == 7) { work_target = "work07"; }
    else if (lesson == 8) { work_target = "work08"; }
    else if (lesson == 9) { work_target = "work09"; }
    else if (lesson == 10) { work_target = "work10"; }
    connection.query('UPDATE result SET ? = ? WHERE student_number = ?', [work_target, score, id], function (error, results, fields) {
        if (error) {
            throw (error);
        } else {
            response.render('./admin/successprocess.ejs');
        }
    });
});

//<=============================>
//<======= learning site =======>
//<=============================>
app.get('/userindex', function (request, response) {
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        var result = results;
        request.session.statecheck = results[0].statecheck;
        response.render('./user/userindex.ejs', { results: result });
    });
});

app.get('/selectlesson', function (request, response) {
    connection.query('SELECT currentstate FROM controller WHERE id = 1', function (error, results, fields) {
        if (error) {
            throw error;
        } else {
            response.render('./user/selectlesson.ejs', { result: results });
        }
    });
});

app.get('/pretest', function (request, response) {
    if (request.session.statecheck > 0) {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    } else {
        response.render('./lesson/pretest.ejs');
    }
});

app.get('/posttest', function (request, response) {
    if (request.session.statecheck != 11) {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    } else {
        response.render('./lesson/posttest.ejs');
    }
});

app.get('/assessmentform', function (request, response) {
    if (request.session.statecheck != 12) {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    } else {
        response.render('./lesson/assessmentform.ejs');
    }
});

app.get('/submittest/(:lesson)/(:state)', function (request, response) {
    var url;
    var student_number = request.session.student_number;
    var A = require('./api/v1/test1/round1');
    var lesson = request.params.lesson;
    var state = request.params.state;
    var target;
    if (lesson == 0) {
        url = '19KQmqZM7KXxU_Q0FAKC_LOoaFnvnDhKvQtAc5FycBXs';
        target = './user/successlogin.ejs';
    } else if (lesson == 1) {
        if (state == 1) {
            url = '1ZA-yJDegKNGgvTn-PrqfFn_cu1nQr2EUxXjG7xDRkw8';
        } else if (state == 2) {
            url = '1goxDvvAskCvul7HCWQNuaXFxKuANXT8NIOS8HF1nwt0';
        } else if (state == 3) {
            url = '1TjOgcuIutxqxj4LDmkUBjpDF4mOpIVwwrpSGU8g5Wmg';
        } else if (state == 4) {
            url = '1oACJ2PEePhXkce8L2Ow_Ygn-ulUAfG0INYrMwHHt7A0';
        }
        target = './lesson/01/lesson01-process.ejs';
    } else if (lesson == 2) {
        if (state == 1) {
            url = '';
        } else if (state == 2) {
            url = '';
        } else if (state == 3) {
            url = '';
        } else if (state == 4) {
            url = '';
        }
        target = './lesson/02/lesson02-process.ejs';
    } else if (lesson == 3) {
        if (state == 1) {
            url = '';
        } else if (state == 2) {
            url = '';
        } else if (state == 3) {
            url = '';
        } else if (state == 4) {
            url = '';
        }
        target = './lesson/03/lesson03-process.ejs';
    } else if (lesson == 4) {
        if (state == 1) {
            url = '';
        } else if (state == 2) {
            url = '';
        } else if (state == 3) {
            url = '';
        } else if (state == 4) {
            url = '';
        }
        target = './lesson/04/lesson04-process.ejs';
    } else if (lesson == 5) {
        if (state == 1) {
            url = '';
        } else if (state == 2) {
            url = '';
        } else if (state == 3) {
            url = '';
        } else if (state == 4) {
            url = '';
        }
        target = './lesson/05/lesson05-process.ejs';
    } else if (lesson == 6) {
        if (state == 1) {
            url = '';
        } else if (state == 2) {
            url = '';
        } else if (state == 3) {
            url = '';
        } else if (state == 4) {
            url = '';
        }
        target = './lesson/06/lesson06-process.ejs';
    } else if (lesson == 7) {
        if (state == 1) {
            url = '';
        } else if (state == 2) {
            url = '';
        } else if (state == 3) {
            url = '';
        } else if (state == 4) {
            url = '';
        }
        target = './lesson/07/lesson07-process.ejs';
    } else if (lesson == 8) {
        if (state == 1) {
            url = '';
        } else if (state == 2) {
            url = '';
        } else if (state == 3) {
            url = '';
        } else if (state == 4) {
            url = '';
        }
        target = './lesson/08/lesson08-process.ejs';
    } else if (lesson == 9) {
        if (state == 1) {
            url = '';
        } else if (state == 2) {
            url = '';
        } else if (state == 3) {
            url = '';
        } else if (state == 4) {
            url = '';
        }
        target = './lesson/09/lesson09-process.ejs';
    } else if (lesson == 10) {
        if (state == 1) {
            url = '';
        } else if (state == 2) {
            url = '';
        } else if (state == 3) {
            url = '';
        } else if (state == 4) {
            url = '';
        }
        target = './lesson/10/lesson10-process.ejs';
    } else if (lesson == 11) { // post test
        url = '1lCbeEt9Ivyuz4FsMWc1v889z_0wUMXGBDJCXUXV3GPQ';
        target = './user/successlogin.ejs';
    }

    A.submitscore(url, lesson, student_number);
    response.render(target);
});

app.post('/sheetcomment/(:lesson)/(:state)/(:worksheet)', function (request, response) {
    var lesson = request.params.lesson;
    var state = request.params.state;
    var worksheet = request.params.worksheet;
    var subdetail = "";
    if (request.body.s5) {
        subdetail = " .1 " + request.body.s1 + " .2 " + request.body.s2 + " .3 " + request.body.s3 + " .4 " + request.body.s4 + " .5 " + request.body.s5;
    }
    var word1 = request.body.r1;
    if (request.body.r2) {
        var word2 = request.body.r2;
        var detail = subdetail + " 1." + word1 + " 2." + word2;
    }
    if (request.body.r3) {
        var word3 = request.body.r3;
        var detail = subdetail + " 1." + word1 + " 2." + word2 + " 3." + word3;
    }
    if (request.body.r4) {
        var word4 = request.body.r4;
        var detail = subdetail + " 1." + word1 + " 2." + word2 + " 3." + word3 + " 4." + word4;
    }
    if (request.body.r5) {
        var word5 = request.body.r5;
        var detail = subdetail + " 1." + word1 + " 2." + word2 + " 3." + word3 + " 4." + word4 + " 5." + word5;
    }
    if (request.body.detail) {
        var detail = request.body.detail;
    }
    connection.query('INSERT INTO sheetcomment(lesson,state,sheet,student_number,username,detail) VALUE (?,?,?,?,?,?)', [lesson, state, worksheet, request.session.student_number, request.session.name, detail], function (error, results2, fields) {
        if (error) {
            response.send('Cannot comment now please try again later.');
        } else {
            if (lesson == 1) {
                if (state == 1) {
                    if (worksheet < 6) {
                        connection.query('UPDATE result SET statecheck = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                                var results = results;
                                response.render('./user/userindex.ejs', { results: results });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            response.render('./lesson/01/lesson01-secondtest.ejs');
                        });
                    }
                } else if (state == 2) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 2', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/01/lesson01-2-2.ejs', { result: result });
                        });
                    });
                } else if (state >= 3) {
                    connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        response.render('./lesson/01/lesson01-successcomment.ejs');
                    });
                }
            } else if (lesson == 2) { //lesson 02
                if (state == 1) {
                    if (worksheet < 6) {
                        connection.query('UPDATE result SET statecheck = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                                var results = results;
                                response.render('./user/userindex.ejs', { results: results });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            response.render('./lesson/02/lesson02-secondtest.ejs');
                        });
                    }
                } else if (state == 2) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 2', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/02/lesson02-2-2.ejs', { result: result });
                        });
                    });
                } else if (state >= 3) {
                    connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        response.render('./lesson/02/lesson02-successcomment.ejs');
                    });
                }
            } else if (lesson == 3) { //lesson 03
                if (state == 1) {
                    if (worksheet < 6) {
                        connection.query('UPDATE result SET statecheck = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                                var results = results;
                                response.render('./user/userindex.ejs', { results: results });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            response.render('./lesson/03/lesson03-secondtest.ejs');
                        });
                    }
                } else if (state == 2) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 2', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/03/lesson03-2-2.ejs', { result: result });
                        });
                    });
                } else if (state >= 3) {
                    connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        response.render('./lesson/03/lesson03-successcomment.ejs');
                    });
                }
            } else if (lesson == 4) { //lesson 04
                if (state == 1) {
                    if (worksheet < 6) {
                        connection.query('UPDATE result SET statecheck = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                                var results = results;
                                response.render('./user/userindex.ejs', { results: results });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            response.render('./lesson/04/lesson04-secondtest.ejs');
                        });
                    }
                } else if (state == 2) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 2', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/04/lesson04-2-2.ejs', { result: result });
                        });
                    });
                } else if (state >= 3) {
                    connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        response.render('./lesson/04/lesson04-successcomment.ejs');
                    });
                }
            } else if (lesson == 5) { //lesson 05
                if (state == 1) {
                    if (worksheet < 6) {
                        connection.query('UPDATE result SET statecheck = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                                var results = results;
                                response.render('./user/userindex.ejs', { results: results });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            response.render('./lesson/05/lesson05-secondtest.ejs');
                        });
                    }
                } else if (state == 2) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 2', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/05/lesson05-2-2.ejs', { result: result });
                        });
                    });
                } else if (state >= 3) {
                    connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        response.render('./lesson/05/lesson05-successcomment.ejs');
                    });
                }
            } else if (lesson == 6) { //lesson 06
                if (state == 1) {
                    if (worksheet < 6) {
                        connection.query('UPDATE result SET statecheck = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                                var results = results;
                                response.render('./user/userindex.ejs', { results: results });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            response.render('./lesson/06/lesson06-secondtest.ejs');
                        });
                    }
                } else if (state == 2) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 2', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/06/lesson06-2-2.ejs', { result: result });
                        });
                    });
                } else if (state >= 3) {
                    connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        response.render('./lesson/06/lesson06-successcomment.ejs');
                    });
                }
            } else if (lesson == 7) { //lesson 07
                if (state == 1) {
                    if (worksheet < 6) {
                        connection.query('UPDATE result SET statecheck = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                                var results = results;
                                response.render('./user/userindex.ejs', { results: results });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            response.render('./lesson/07/lesson07-secondtest.ejs');
                        });
                    }
                } else if (state == 2) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 7 AND state = 2', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/07/lesson07-2-2.ejs', { result: result });
                        });
                    });
                } else if (state >= 3) {
                    connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        response.render('./lesson/07/lesson07-successcomment.ejs');
                    });
                }
            } else if (lesson == 8) { //lesson 08
                if (state == 1) {
                    if (worksheet < 6) {
                        connection.query('UPDATE result SET statecheck = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                                var results = results;
                                response.render('./user/userindex.ejs', { results: results });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            response.render('./lesson/08/lesson08-secondtest.ejs');
                        });
                    }
                } else if (state == 2) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 8 AND state = 2', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/08/lesson08-2-2.ejs', { result: result });
                        });
                    });
                } else if (state >= 3) {
                    connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        response.render('./lesson/08/lesson08-successcomment.ejs');
                    });
                }
            } else if (lesson == 9) { //lesson 09
                if (state == 1) {
                    if (worksheet < 6) {
                        connection.query('UPDATE result SET statecheck = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                                var results = results;
                                response.render('./user/userindex.ejs', { results: results });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            response.render('./lesson/09/lesson09-secondtest.ejs');
                        });
                    }
                } else if (state == 2) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 9 AND state = 2', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/09/lesson09-2-2.ejs', { result: result });
                        });
                    });
                } else if (state >= 3) {
                    connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        response.render('./lesson/09/lesson09-successcomment.ejs');
                    });
                }
            } else if (lesson == 10) { //lesson 10
                if (state == 1) {
                    if (worksheet < 6) {
                        connection.query('UPDATE result SET statecheck = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                                var results = results;
                                response.render('./user/userindex.ejs', { results: results });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                            response.render('./lesson/10/lesson10-secondtest.ejs');
                        });
                    }
                } else if (state == 2) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 10 AND state = 2', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/10/lesson10-2-2.ejs', { result: result });
                        });
                    });
                } else if (state >= 3) {
                    connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                        response.render('./lesson/10/lesson10-successcomment.ejs');
                    });
                }
            }

        }
    });
});

//======= lesson01 =======
app.get('/checkroute01', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.round01 == 0) {
            response.render('./lesson/01/lesson01-firsttest.ejs');
        } else if (data.round01 == 1) {
            if (data.status_number == 0) {
                response.render('./lesson/01/lesson01-1-2.ejs');
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 1', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/01/lesson01-1-3.ejs', { result: result });
                });
            } else if (data.status_number == 2) {

                response.render(random_workpage(1, 1, 6, 10));

            } else if (data.status_number == 3) {
                response.render('./lesson/01/lesson01-secondtest.ejs');
            }
        } else if (data.round01 == 2) {
            if (data.status_number == 0) {
                response.render('./lesson/01/lesson01-2-1.ejs');
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 2', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1
                    }
                    response.render('./lesson/01/lesson01-2-2.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render('./lesson/01/lesson01-thirdtest.ejs');
            }
        } else if (data.round01 == 3) {
            if (data.status_number == 0) {
                response.render('./lesson/01/lesson01-3-1.ejs');
            } else if (data.status_number < 7) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 3', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-2
                    }
                    response.render('./lesson/01/lesson01-3-2.ejs', { result: result });
                });
            } else {
                response.render('./lesson/01/lesson01-fourthtest.ejs');
            }
        } else if (data.round01 >= 4) {
            if (data.status_number < 5) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 4 AND student_number = ?', [request.session.student_number], function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-2
                    }
                    response.render('./lesson/01/lesson01-4-1.ejs', { result: result });
                });
            } else {
                response.render('./lesson/01/lesson01-fourthtest.ejs');
            }
        }
    });
});

app.get('/checkstate01', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.test01 < 8) {
            if (data.round01 == 0) {
                connection.query('UPDATE result SET round01 = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    response.render('./lesson/01/lesson01-1-2.ejs');
                });
            } else if (data.round01 == 1) {
                if (data.status_number == 0) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 1', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1-5
                            }
                            response.render('./lesson/01/lesson01-1-3.ejs', { result: result });
                        });
                    });
                } else if (data.status_number == 1) {
                    response.render(random_workpage(1, 1, 6, 10));
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round01 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/01/lesson01-2-1.ejs');
                    });
                } else if (data.status_number == 3) {
                    connection.query('UPDATE result SET round01 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/01/lesson01-2-1.ejs');
                    });
                }
            } else if (data.round01 == 2) {
                if (data.status_number == 1) {
                    connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/01/lesson01-thirdtest.ejs');
                    });
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round01 = 3,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/01/lesson01-3-1.ejs');
                    });
                }
            } else if (data.round01 == 3) {
                if (data.status_number == 0) {
                    if (data.test01 > 5) {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 3', function (error, results, fields) {
                                if (results.length > 0) {
                                    var result = results;
                                } else {
                                    var result = json_no_datasheet; //sheet 1-2
                                }
                                response.render('./lesson/01/lesson01-3-2.ejs', { result: result });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            response.render('./lesson/01/lesson01-3-1.ejs');
                        });
                    }
                } else if (data.status_number < 7) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 3', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 1-2
                        }
                        response.render('./lesson/01/lesson01-3-2.ejs', { result: result });
                    });
                } else if (data.status_number == 7) {
                    connection.query('UPDATE result SET status_number = 0,round01 = 4 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 4', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 2
                            }
                            response.render('./lesson/01/lesson01-4-1.ejs', { result: result });
                        });
                    });
                }
            } else if (data.round01 >= 4) {
                connection.query('UPDATE result SET status_number = 0,round01 = round01 + 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 4', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 2
                        }
                        response.render('./lesson/01/lesson01-4-1.ejs', { result: result });
                    });
                });
            }
        } else {
            if (data.round01 == 0) {
                response.render(random_workpage(1, 1, 1, 5));
            } else if (data.round01 > 0) {
                connection.query('UPDATE result SET statecheck = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                        var results = results;
                        response.render('./user/userindex.ejs', { results: results });
                    });
                });
            }
        }
    });
});

app.get('/detail01', function (request, response) {
    if (request.session.statecheck == 1) {
        response.render('./lesson/01/detail01.ejs');
    } else {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    }
});
app.get('/lesson01-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-2
        }
        response.render('./lesson/01/lesson01-3-2.ejs', { result: result });
    });
});
app.get('/lesson01-4-1', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 4 AND student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-2
        }
        response.render('./lesson/01/lesson01-4-1.ejs', { result: result });
    });
});

//======= lesson02 =======
app.get('/checkroute02', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.round02 == 0) {
            response.render('./lesson/02/lesson02-firsttest.ejs');
        } else if (data.round02 == 1) {
            if (data.status_number == 0) {
                response.render('./lesson/02/lesson02-1-2.ejs');
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 1', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/02/lesson02-1-3.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render(random_workpage(2, 1, 6, 10));
            } else if (data.status_number == 3) {
                response.render('./lesson/02/lesson02-secondtest.ejs');
            }
        } else if (data.round02 == 2) {
            if (data.status_number == 0) {
                response.render(random_workpage(2, 2, 1, 5));
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 2', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/02/lesson02-2-2.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render('./lesson/02/lesson02-thirdtest.ejs');
            }
        } else if (data.round02 == 3) {
            if (data.status_number == 0) {
                response.render(random_workpage(2, 3, 1, 5));
            } else if (data.status_number < 7) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 3', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/02/lesson02-3-2.ejs', { result: result });
                });
            } else {
                response.render('./lesson/02/lesson02-fourthtest.ejs');
            }
        } else if (data.round02 >= 4) {
            if (data.status_number < 5) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 4 AND student_number = ?', [request.session.student_number], function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-2
                    }
                    response.render('./lesson/02/lesson02-4.ejs', { result: result });
                });
            } else {
                response.render('./lesson/02/lesson02-fourthtest.ejs');
            }
        }
    });
});

app.get('/checkstate02', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.test02 < 8) {
            if (data.round02 == 0) {
                connection.query('UPDATE result SET round02 = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    response.render('./lesson/02/lesson02-1-2.ejs');
                });
            } else if (data.round02 == 1) {
                if (data.status_number == 0) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 1', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1-5
                            }
                            response.render('./lesson/02/lesson02-1-3.ejs', { result: result });
                        });
                    });
                } else if (data.status_number == 1) {
                    response.render(random_workpage(2, 1, 6, 10));
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round02 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/02/lesson02-2-1.ejs');
                    });
                } else if (data.status_number == 3) {
                    connection.query('UPDATE result SET round02 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render(random_workpage(2, 2, 1, 5));
                    });
                }
            } else if (data.round02 == 2) {
                if (data.status_number == 1) {
                    connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/02/lesson02-thirdtest.ejs');
                    });
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round02 = 3,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render(random_workpage(2, 3, 1, 5));
                    });
                }
            } else if (data.round02 == 3) {
                if (data.status_number == 0) {
                    if (data.test02 > 5) {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 3', function (error, results, fields) {
                                if (results.length > 0) {
                                    var result = results;
                                } else {
                                    var result = json_no_datasheet; //sheet 1-5
                                }
                                response.render('./lesson/02/lesson02-3-2.ejs', { result: result });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            response.render(random_workpage(2, 3, 1, 5));
                        });
                    }
                } else if (data.status_number < 7) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 3', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 1-2
                        }
                        response.render('./lesson/02/lesson02-3-2.ejs', { result: result });
                    });
                } else if (data.status_number == 7) {
                    connection.query('UPDATE result SET status_number = 0,round02 = 4 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 4', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 2
                            }
                            response.render('./lesson/02/lesson02-4.ejs', { result: result });
                        });
                    });
                }
            } else if (data.round02 >= 4) {
                connection.query('UPDATE result SET status_number = 0,round02 = round02 + 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 4', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 2
                        }
                        response.render('./lesson/02/lesson02-4.ejs', { result: result });
                    });
                });
            }
        } else {
            if (data.round02 == 0) {
                response.render(random_workpage(2, 1, 1, 5));
            } else if (data.round02 > 0) {
                connection.query('UPDATE result SET statecheck = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                        var results = results;
                        response.render('./user/userindex.ejs', { results: results });
                    });
                });
            }
        }
    });
});

app.get('/detail02', function (request, response) {
    if (request.session.statecheck == 2) {
        response.render('./lesson/02/detail02.ejs');
    } else {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    }
});
app.get('/lesson02-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-5
        }
        response.render('./lesson/02/lesson02-3-2.ejs', { result: result });
    });
});
app.get('/lesson02-4', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 2 AND state = 4', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 2
        }
        response.render('./lesson/02/lesson02-4.ejs', { result: result });
    });
});

//======= lesson03 =======
app.get('/checkroute03', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.round03 == 0) {
            response.render('./lesson/03/lesson03-firsttest.ejs');
        } else if (data.round03 == 1) {
            if (data.status_number == 0) {
                response.render('./lesson/03/lesson03-1-2.ejs');
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 1', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/03/lesson03-1-3.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render(random_workpage(3, 1, 6, 10));
            } else if (data.status_number == 3) {
                response.render('./lesson/03/lesson03-secondtest.ejs');
            }
        } else if (data.round03 == 2) {
            if (data.status_number == 0) {
                response.render(random_workpage(3, 2, 1, 5));
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 2', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/03/lesson03-2-2.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render('./lesson/03/lesson03-thirdtest.ejs');
            }
        } else if (data.round03 == 3) {
            if (data.status_number == 0) {
                response.render(random_workpage(3, 3, 1, 5));
            } else if (data.status_number < 7) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 3', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/03/lesson03-3-2.ejs', { result: result });
                });
            } else {
                response.render('./lesson/03/lesson03-fourthtest.ejs');
            }
        } else if (data.round03 >= 4) {
            if (data.status_number < 5) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 4 AND student_number = ?', [request.session.student_number], function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-2
                    }
                    response.render('./lesson/03/lesson03-4.ejs', { result: result });
                });
            } else {
                response.render('./lesson/03/lesson03-fourthtest.ejs');
            }
        }
    });
});

app.get('/checkstate03', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.test03 < 8) { // failed test
            if (data.round03 == 0) {
                connection.query('UPDATE result SET round03 = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    response.render('./lesson/03/lesson03-1-2.ejs');
                });
            } else if (data.round03 == 1) {
                if (data.status_number == 0) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 1', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1-5
                            }
                            response.render('./lesson/03/lesson03-1-3.ejs', { result: result });
                        });
                    });
                } else if (data.status_number == 1) {
                    response.render(random_workpage(3, 1, 6, 10));
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round03 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/03/lesson03-2-1.ejs');
                    });
                } else if (data.status_number == 3) {
                    connection.query('UPDATE result SET round03 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render(random_workpage(3, 2, 1, 5));
                    });
                }
            } else if (data.round03 == 2) {
                if (data.status_number == 1) {
                    connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/03/lesson03-thirdtest.ejs');
                    });
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round03 = 3,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render(random_workpage(3, 3, 1, 5));
                    });
                }
            } else if (data.round03 == 3) {
                if (data.status_number == 0) {
                    if (data.test03 > 5) {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 3', function (error, results, fields) {
                                if (results.length > 0) {
                                    var result = results;
                                } else {
                                    var result = json_no_datasheet; //sheet 1-5
                                }
                                response.render('./lesson/03/lesson03-3-2.ejs', { result: result });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            response.render(random_workpage(3, 3, 1, 5));
                        });
                    }
                } else if (data.status_number < 7) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 3', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 1-2
                        }
                        response.render('./lesson/03/lesson03-3-2.ejs', { result: result });
                    });
                } else if (data.status_number == 7) {
                    connection.query('UPDATE result SET status_number = 0,round03 = 4 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 4', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 2
                            }
                            response.render('./lesson/03/lesson03-4.ejs', { result: result });
                        });
                    });
                }
            } else if (data.round03 >= 4) {
                connection.query('UPDATE result SET status_number = 0,round03 = round03 + 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 4', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 2
                        }
                        response.render('./lesson/03/lesson03-4.ejs', { result: result });
                    });
                });
            }
        } else { // pass the test
            if (data.round03 == 0) {
                response.render(random_workpage(3, 1, 1, 5));
            } else if (data.round03 > 0) {
                connection.query('UPDATE result SET statecheck = 3,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                        var results = results;
                        response.render('./user/userindex.ejs', { results: results });
                    });
                });
            }
        }
    });
});

app.get('/detail03', function (request, response) {
    if (request.session.statecheck == 3) {
        response.render('./lesson/detail03.ejs');
    } else {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    }
});
app.get('/lesson03-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-5
        }
        response.render('./lesson/03/lesson03-3-2.ejs', { result: result });
    });
});
app.get('/lesson03-4', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 3 AND state = 4', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 2
        }
        response.render('./lesson/03/lesson03-4.ejs', { result: result });
    });
});

//======= lesson04 =======
app.get('/checkroute04', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.round04 == 0) {
            response.render('./lesson/04/lesson04-firsttest.ejs');
        } else if (data.round04 == 1) {
            if (data.status_number == 0) {
                response.render('./lesson/04/lesson04-1-2.ejs');
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 1', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/04/lesson04-1-3.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render(random_workpage(4, 1, 6, 10));
            } else if (data.status_number == 3) {
                response.render('./lesson/04/lesson04-secondtest.ejs');
            }
        } else if (data.round04 == 2) {
            if (data.status_number == 0) {
                response.render(random_workpage(4, 2, 1, 5));
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 2', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/04/lesson04-2-2.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render('./lesson/04/lesson04-thirdtest.ejs');
            }
        } else if (data.round04 == 3) {
            if (data.status_number == 0) {
                response.render(random_workpage(4, 3, 1, 5));
            } else if (data.status_number < 7) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 3', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/04/lesson04-3-2.ejs', { result: result });
                });
            } else {
                response.render('./lesson/04/lesson04-fourthtest.ejs');
            }
        } else if (data.round04 >= 4) {
            if (data.status_number < 5) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 4 AND student_number = ?', [request.session.student_number], function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-2
                    }
                    response.render('./lesson/04/lesson04-4.ejs', { result: result });
                });
            } else {
                response.render('./lesson/04/lesson04-fourthtest.ejs');
            }
        }
    });
});

app.get('/checkstate04', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.test04 < 8) { // failed test
            if (data.round04 == 0) {
                connection.query('UPDATE result SET round04 = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    response.render('./lesson/04/lesson04-1-2.ejs');
                });
            } else if (data.round04 == 1) {
                if (data.status_number == 0) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 1', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1-5
                            }
                            response.render('./lesson/04/lesson04-1-3.ejs', { result: result });
                        });
                    });
                } else if (data.status_number == 1) {
                    response.render(random_workpage(4, 1, 6, 10));
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round04 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/04/lesson04-2-1.ejs');
                    });
                } else if (data.status_number == 3) {
                    connection.query('UPDATE result SET round04 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render(random_workpage(4, 2, 1, 5));
                    });
                }
            } else if (data.round04 == 2) {
                if (data.status_number == 1) {
                    connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/04/lesson04-thirdtest.ejs');
                    });
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round04 = 3,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render(random_workpage(4, 3, 1, 5));
                    });
                }
            } else if (data.round04 == 3) {
                if (data.status_number == 0) {
                    if (data.test04 > 5) {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 3', function (error, results, fields) {
                                if (results.length > 0) {
                                    var result = results;
                                } else {
                                    var result = json_no_datasheet; //sheet 1-5
                                }
                                response.render('./lesson/04/lesson04-3-2.ejs', { result: result });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            response.render(random_workpage(4, 3, 1, 5));
                        });
                    }
                } else if (data.status_number < 7) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 3', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 1-2
                        }
                        response.render('./lesson/04/lesson04-3-2.ejs', { result: result });
                    });
                } else if (data.status_number == 7) {
                    connection.query('UPDATE result SET status_number = 0,round04 = 4 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 4', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 2
                            }
                            response.render('./lesson/04/lesson04-4.ejs', { result: result });
                        });
                    });
                }
            } else if (data.round04 >= 4) {
                connection.query('UPDATE result SET status_number = 0,round04 = round04 + 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 4', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 2
                        }
                        response.render('./lesson/04/lesson04-4.ejs', { result: result });
                    });
                });
            }
        } else { // pass the test
            if (data.round04 == 0) {
                response.render(random_workpage(4, 1, 1, 5));
            } else if (data.round04 > 0) {
                connection.query('UPDATE result SET statecheck = 4,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                        var results = results;
                        response.render('./user/userindex.ejs', { results: results });
                    });
                });
            }
        }
    });
});

app.get('/detail04', function (request, response) {
    if (request.session.statecheck == 4) {
        response.render('./lesson/detail04.ejs');
    } else {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    }
});
app.get('/lesson04-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-5
        }
        response.render('./lesson/04/lesson04-3-2.ejs', { result: result });
    });
});
app.get('/lesson04-4', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 4 AND state = 4', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 2
        }
        response.render('./lesson/04/lesson04-4.ejs', { result: result });
    });
});

//=======lesson05=======
app.get('/checkroute05', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.round05 == 0) {
            response.render('./lesson/05/lesson05-firsttest.ejs');
        } else if (data.round05 == 1) {
            if (data.status_number == 0) {
                response.render('./lesson/05/lesson05-1-2.ejs');
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 1', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/05/lesson05-1-3.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render(random_workpage(5, 1, 6, 10));
            } else if (data.status_number == 3) {
                response.render('./lesson/05/lesson05-secondtest.ejs');
            }
        } else if (data.round05 == 2) {
            if (data.status_number == 0) {
                response.render(random_workpage(5, 2, 1, 5));
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 2', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/05/lesson05-2-2.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render('./lesson/05/lesson05-thirdtest.ejs');
            }
        } else if (data.round05 == 3) {
            if (data.status_number == 0) {
                response.render(random_workpage(5, 3, 1, 5));
            } else if (data.status_number < 7) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 3', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-5
                    }
                    response.render('./lesson/05/lesson05-3-2.ejs', { result: result });
                });
            } else {
                response.render('./lesson/05/lesson05-fourthtest.ejs');
            }
        } else if (data.round05 >= 4) {
            if (data.status_number < 5) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 4 AND student_number = ?', [request.session.student_number], function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-2
                    }
                    response.render('./lesson/05/lesson05-4.ejs', { result: result });
                });
            } else {
                response.render('./lesson/05/lesson05-fourthtest.ejs');
            }
        }
    });
});

app.get('/checkstate05', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.test05 < 8) { // failed test
            if (data.round05 == 0) {
                connection.query('UPDATE result SET round05 = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    response.render('./lesson/05/lesson05-1-2.ejs');
                });
            } else if (data.round05 == 1) {
                if (data.status_number == 0) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 1', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1-5
                            }
                            response.render('./lesson/05/lesson05-1-3.ejs', { result: result });
                        });
                    });
                } else if (data.status_number == 1) {
                    response.render(random_workpage(5, 1, 6, 10));
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round05 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/05/lesson05-2-1.ejs');
                    });
                } else if (data.status_number == 3) {
                    connection.query('UPDATE result SET round05 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render(random_workpage(5, 2, 1, 5));
                    });
                }
            } else if (data.round05 == 2) {
                if (data.status_number == 1) {
                    connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/05/lesson05-thirdtest.ejs');
                    });
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round05 = 3,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render(random_workpage(5, 3, 1, 5));
                    });
                }
            } else if (data.round05 == 3) {
                if (data.status_number == 0) {
                    if (data.test05 > 5) {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 3', function (error, results, fields) {
                                if (results.length > 0) {
                                    var result = results;
                                } else {
                                    var result = json_no_datasheet; //sheet 1-5
                                }
                                response.render('./lesson/05/lesson05-3-2.ejs', { result: result });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            response.render(random_workpage(5, 3, 1, 5));
                        });
                    }
                } else if (data.status_number < 7) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 3', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 1-5
                        }
                        response.render('./lesson/05/lesson05-3-2.ejs', { result: result });
                    });
                } else if (data.status_number == 7) {
                    connection.query('UPDATE result SET status_number = 0,round05 = 4 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 4', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 2
                            }
                            response.render('./lesson/05/lesson05-4.ejs', { result: result });
                        });
                    });
                }
            } else if (data.round05 >= 4) {
                connection.query('UPDATE result SET status_number = 0,round05 = round05 + 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 4', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 2
                        }
                        response.render('./lesson/05/lesson05-4.ejs', { result: result });
                    });
                });
            }
        } else { // pass the test
            if (data.round05 == 0) {
                response.render(random_workpage(5, 1, 1, 5));
            } else if (data.round05 > 0) {
                connection.query('UPDATE result SET statecheck = 5,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                        var results = results;
                        response.render('./user/userindex.ejs', { results: results });
                    });
                });
            }
        }
    });
});

app.get('/detail05', function (request, response) {
    if (request.session.statecheck == 5) {
        response.render('./lesson/detail05.ejs');
    } else {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    }
});
app.get('/lesson05-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-5
        }
        response.render('./lesson/05/lesson05-3-2.ejs', { result: result });
    });
});
app.get('/lesson05-4', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 5 AND state = 4', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 2
        }
        response.render('./lesson/05/lesson05-4.ejs', { result: result });
    });
});

//=======lesson06=======
app.get('/checkroute06', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.round06 == 0) {
            response.render('./lesson/06/lesson06-firsttest.ejs');
        } else if (data.round06 == 1) {
            if (data.status_number == 0) {
                response.render('./lesson/06/lesson06-1-2.ejs');
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 1', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1
                    }
                    response.render('./lesson/06/lesson06-1-3.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render('./lesson/06/lesson06-1-w6.ejs');
            } else if (data.status_number == 3) {
                response.render('./lesson/06/lesson06-secondtest.ejs');
            }
        } else if (data.round06 == 2) {
            if (data.status_number == 0) {
                response.render('./lesson/06/lesson06-2-w1.ejs');
            } else if (data.status_number == 1) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 2', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1
                    }
                    response.render('./lesson/06/lesson06-2-2.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                response.render('./lesson/06/lesson06-thirdtest.ejs');
            }
        } else if (data.round06 == 3) {
            if (data.status_number == 0) {
                response.render('./lesson/06/lesson06-3-w1.ejs');
            } else if (data.status_number < 7) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 3', function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1
                    }
                    response.render('./lesson/06/lesson06-3-2.ejs', { result: result });
                });
            } else {
                response.render('./lesson/06/lesson06-fourthtest.ejs');
            }
        } else if (data.round06 >= 4) {
            if (data.status_number < 5) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 4 AND student_number = ?', [request.session.student_number], function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = json_no_datasheet; //sheet 1-2
                    }
                    response.render('./lesson/06/lesson06-4.ejs', { result: result });
                });
            } else {
                response.render('./lesson/06/lesson06-fourthtest.ejs');
            }
        }
    });
});

app.get('/checkstate06', function (request, response) {
    var student_number = request.session.student_number;
    connection.query('SELECT * FROM result WHERE student_number = ?', [student_number], function (error, results, fields) {
        var data = results[0];
        if (data.test06 < 8) { // failed test
            if (data.round06 == 0) {
                connection.query('UPDATE result SET round06 = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    response.render('./lesson/06/lesson06-1-2.ejs');
                });
            } else if (data.round06 == 1) {
                if (data.status_number == 0) {
                    connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 1', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 1
                            }
                            response.render('./lesson/06/lesson06-1-3.ejs', { result: result });
                        });
                    });
                } else if (data.status_number == 1) {
                    response.render('./lesson/06/lesson06-1-w6.ejs');
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round06 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/06/lesson06-2-1.ejs');
                    });
                } else if (data.status_number == 3) {
                    connection.query('UPDATE result SET round06 = 2,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/06/lesson06-2-w1.ejs');
                    });
                }
            } else if (data.round06 == 2) {
                if (data.status_number == 1) {
                    connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/06/lesson06-thirdtest.ejs');
                    });
                } else if (data.status_number == 2) {
                    connection.query('UPDATE result SET round06 = 3,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        response.render('./lesson/06/lesson06-3-w1.ejs');
                    });
                }
            } else if (data.round06 == 3) {
                if (data.status_number == 0) {
                    if (data.test06 > 5) {
                        connection.query('UPDATE result SET status_number = 2 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 3', function (error, results, fields) {
                                if (results.length > 0) {
                                    var result = results;
                                } else {
                                    var result = json_no_datasheet; //sheet 1
                                }
                                response.render('./lesson/06/lesson06-3-2.ejs', { result: result });
                            });
                        });
                    } else {
                        connection.query('UPDATE result SET status_number = 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                            response.render('./lesson/06/lesson06-3-w1.ejs');
                        });
                    }
                } else if (data.status_number < 7) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 3', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 1
                        }
                        response.render('./lesson/06/lesson06-3-2.ejs', { result: result });
                    });
                } else if (data.status_number == 7) {
                    connection.query('UPDATE result SET status_number = 0,round06 = 4 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 4', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = json_no_datasheet; //sheet 2
                            }
                            response.render('./lesson/06/lesson06-4.ejs', { result: result });
                        });
                    });
                }
            } else if (data.round06 >= 4) {
                connection.query('UPDATE result SET status_number = 0,round06 = round06 + 1 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 4', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = json_no_datasheet; //sheet 2
                        }
                        response.render('./lesson/06/lesson06-4.ejs', { result: result });
                    });
                });
            }
        } else { // pass the test
            if (data.round06 == 0) {
                response.render('./lesson/06/lesson06-1-w1.ejs');
            } else if (data.round06 > 0) {
                connection.query('UPDATE result SET statecheck = 6,status_number = 0 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
                        var results = results;
                        response.render('./user/userindex.ejs', { results: results });
                    });
                });
            }
        }
    });
});

app.get('/detail06', function (request, response) {
    if (request.session.statecheck == 6) {
        response.render('./lesson/detail06.ejs');
    } else {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    }
});
app.get('/lesson06-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-5
        }
        response.render('./lesson/06/lesson06-3-2.ejs', { result: result });
    });
});
app.get('/lesson06-4', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 6 AND state = 4', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 2
        }
        response.render('./lesson/06/lesson06-4.ejs', { result: result });
    });
});

//=======lesson07=======
app.get('/detail07', function (request, response) {
    if (request.session.statecheck == 7) {
        response.render('./lesson/detail07.ejs');
    } else {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    }
});
app.get('/lesson07-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 7 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-5
        }
        response.render('./lesson/07/lesson07-3-2.ejs', { result: result });
    });
});
app.get('/lesson07-4', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 7 AND state = 4', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 2
        }
        response.render('./lesson/07/lesson07-4.ejs', { result: result });
    });
});

//=======lesson08=======
app.get('/detail08', function (request, response) {
    if (request.session.statecheck == 8) {
        response.render('./lesson/detail08.ejs');
    } else {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    }
});
app.get('/lesson08-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 8 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-5
        }
        response.render('./lesson/08/lesson08-3-2.ejs', { result: result });
    });
});
app.get('/lesson08-4', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 8 AND state = 4', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 2
        }
        response.render('./lesson/08/lesson08-4.ejs', { result: result });
    });
});

//=======lesson09=======
app.get('/detail09', function (request, response) {
    if (request.session.statecheck == 9) {
        response.render('./lesson/detail09.ejs');
    } else {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    }
});
app.get('/lesson09-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 9 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-5
        }
        response.render('./lesson/09/lesson09-3-2.ejs', { result: result });
    });
});
app.get('/lesson09-4', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 9 AND state = 4', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 2
        }
        response.render('./lesson/09/lesson09-4.ejs', { result: result });
    });
});

//=======lesson10=======
app.get('/detail10', function (request, response) {
    if (request.session.statecheck == 10) {
        response.render('./lesson/detail10.ejs');
    } else {
        connection.query('SELECT * FROM controller', function (error, results, fields) {
            response.render('./user/selectlesson.ejs', { result: results });
        });
    }
});
app.get('/lesson10-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 10 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 1-5
        }
        response.render('./lesson/10/lesson10-3-2.ejs', { result: result });
    });
});
app.get('/lesson10-4', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 10 AND state = 4', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = json_no_datasheet; //sheet 2
        }
        response.render('./lesson/10/lesson10-4.ejs', { result: result });
    });
});

//<================>
// app is on port...
//<================>
app.listen(3200);