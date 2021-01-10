//require("dotenv").config();
process.env.PWD = process.cwd()

var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const sheets = google.sheets('v4');
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
app.post('/addaccounts', function (request, response) {
    var id = request.body.id;
    var password = request.body.password;
    var name = request.body.name;
    var surname = request.body.surname;
    connection.query('INSERT INTO accounts VALUE (?,?,?,?)', [id, password, name, surname], function (error, results, fields) {
        connection.query('INSERT INTO result VALUE (?,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)', [id], function (error, results, fields) {
            response.render('./admin/adminindex.ejs');
        });
    });
});
//<=============================>
//<======= learning site =======>
//<=============================>

app.get('/userindex', function (request, response) {
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        var results = results;
        response.render('./user/userindex.ejs', { results: results });
    });
});

app.get('/selectlesson', function (request, response) {
    connection.query('SELECT * FROM controller', function (error, results, fields) {
        if (error) {
            throw error;
        } else {
            response.render('./user/selectlesson.ejs', { result: results });
        }
    });
});

app.get('/pretest', function (request, response) {
    connection.query('SELECT * FROM result WHERE student_number = ?',[request.session.student_number], function (error, results, fields) {
        if ( results[0].statecheck > 0) {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        } else {
            response.render('./lesson/pretest.ejs');
        }
    });
});

app.get('/posttest', function (request, response) {
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck != 11) {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        } else {
            response.render('./lesson/posttest.ejs');
        }
    });
});

app.get('/assessmentform', function (request, response) {
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck != 12) {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        } else {
            response.render('./lesson/assessmentform.ejs');
        }
    });
});

app.get('/submittest/(:lesson)/(:state)', function (request, response) {
    var url;
    var student_number = request.session.student_number;
    var A = require('./api/v1/test1/round1');
    var lesson = request.params.lesson;
    var state = request.params.state;
    //url_posttest = '1lCbeEt9Ivyuz4FsMWc1v889z_0wUMXGBDJCXUXV3GPQ';
    if (lesson == 0) {
        url = '19KQmqZM7KXxU_Q0FAKC_LOoaFnvnDhKvQtAc5FycBXs';
        A.submitscore(url, lesson, student_number);
        connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
            var results = results;
            response.render('./user/userindex.ejs', { results: results });
        });
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
        A.submitscore(url, lesson, student_number);
        response.render('./lesson/01/lesson01-process.ejs');
    }
});

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
                        var result = [
                            {
                                sheet: '1',
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            },
                            {
                                sheet: '2',
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            },
                            {
                                sheet: '3',
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            },
                            {
                                sheet: '4',
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            },
                            {
                                sheet: '5',
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            }];
                    }
                    response.render('./lesson/01/lesson01-1-3.ejs', { result: result });
                });
            } else if (data.status_number == 2) {
                var random_page = Math.floor(Math.random() * 5) + 1;
                switch (random_page) {
                    case 1:
                        response.render('./lesson/01/lesson01-1-w6.ejs');
                        break;
                    case 2:
                        response.render('./lesson/01/lesson01-1-w7.ejs');
                        break;
                    case 3:
                        response.render('./lesson/01/lesson01-1-w8.ejs');
                        break;
                    case 4:
                        response.render('./lesson/01/lesson01-1-w9.ejs');
                        break;
                    case 5:
                        response.render('./lesson/01/lesson01-1-w10.ejs');
                        break;
                    default:
                        response.render('./lesson/01/lesson01-1-w6.ejs');
                }
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
                        var result = [
                            {
                                sheet: '1',
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            }];
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
                        var result = [
                            {
                                sheet: '1',
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            }, {
                                sheet: '2',
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            }];
                    }
                    response.render('./lesson/01/lesson01-3-2.ejs', { result: result });
                });
            } else {
                response.render('./lesson/01/lesson01-fourthtest.ejs');
            }
        } else if (data.round01 >= 4) {
            if (data.status_number < 5) {
                connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 4 AND student_number = ?', [request, session.student_number], function (error, results, fields) {
                    if (results.length > 0) {
                        var result = results;
                    } else {
                        var result = [{
                            sheet: 1,
                            student_number: 'No data',
                            username: 'No data',
                            detail: 'No data'
                        },
                        {
                            sheet: 2,
                            student_number: 'No data',
                            username: 'No data',
                            detail: 'No data'
                        }];
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
                                var result = [
                                    {
                                        sheet: '1',
                                        student_number: 'No data',
                                        username: 'No data',
                                        detail: 'No data'
                                    },
                                    {
                                        sheet: '2',
                                        student_number: 'No data',
                                        username: 'No data',
                                        detail: 'No data'
                                    },
                                    {
                                        sheet: '3',
                                        student_number: 'No data',
                                        username: 'No data',
                                        detail: 'No data'
                                    },
                                    {
                                        sheet: '4',
                                        student_number: 'No data',
                                        username: 'No data',
                                        detail: 'No data'
                                    },
                                    {
                                        sheet: '5',
                                        student_number: 'No data',
                                        username: 'No data',
                                        detail: 'No data'
                                    }];
                            }
                            response.render('./lesson/01/lesson01-1-3.ejs', { result: result });
                        });
                    });
                } else if (data.status_number == 1) {
                    var random_page = Math.floor(Math.random() * 5) + 1;
                    switch (random_page) {
                        case 1:
                            response.render('./lesson/01/lesson01-1-w6.ejs');
                            break;
                        case 2:
                            response.render('./lesson/01/lesson01-1-w7.ejs');
                            break;
                        case 3:
                            response.render('./lesson/01/lesson01-1-w8.ejs');
                            break;
                        case 4:
                            response.render('./lesson/01/lesson01-1-w9.ejs');
                            break;
                        case 5:
                            response.render('./lesson/01/lesson01-1-w10.ejs');
                            break;
                        default:
                            response.render('./lesson/01/lesson01-1-w6.ejs');
                    }
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
                                    var result = [
                                        {
                                            sheet: '1',
                                            student_number: 'No data',
                                            username: 'No data',
                                            detail: 'No data'
                                        }, {
                                            sheet: '2',
                                            student_number: 'No data',
                                            username: 'No data',
                                            detail: 'No data'
                                        }];
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
                            var result = [{
                                sheet: 1,
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            },
                            {
                                sheet: 2,
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            }];
                        }
                        response.render('./lesson/01/lesson01-3-2.ejs', { result: result });
                    });
                } else if (data.status_number == 7) {
                    connection.query('UPDATE result SET status_number = 0,round01 = 4 WHERE student_number = ?', [student_number], function (error, results2, fields) {
                        connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 4', function (error, results, fields) {
                            if (results.length > 0) {
                                var result = results;
                            } else {
                                var result = [{
                                    sheet: 2,
                                    student_number: 'No data',
                                    username: 'No data',
                                    detail: 'No data'
                                }];
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
                            var result = [{
                                sheet: 2,
                                student_number: 'No data',
                                username: 'No data',
                                detail: 'No data'
                            }];
                        }
                        response.render('./lesson/01/lesson01-4-1.ejs', { result: result });
                    });
                });
            }
        } else {
            if (data.round01 == 0) {
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

app.post('/sheetcomment/(:lesson)/(:state)/(:worksheet)', function (request, response) {
    var lesson = request.params.lesson;
    var state = request.params.state;
    var worksheet = request.params.worksheet;
    var word1 = request.body.r1;
    if (request.body.r2) {
        var word2 = request.body.r2;
        var detail = "1." + word1 + " 2." + word2;
    }
    if (request.body.r3) {
        var word3 = request.body.r3;
        var detail = "1." + word1 + " 2." + word2 + " 3." + word3;
    }
    if (request.body.r4) {
        var word4 = request.body.r4;
        var detail = "1." + word1 + " 2." + word2 + " 3." + word3 + " 4." + word4;
    }
    if (request.body.r5) {
        var word5 = request.body.r5;
        var detail = "1." + word1 + " 2." + word2 + " 3." + word3 + " 4." + word4 + " 5." + word5;
    }
    if (request.body.detail) {
        var detail = request.body.detail;
    }

    connection.query('INSERT INTO sheetcomment(lesson,state,sheet,student_number,username,detail) VALUE (?,?,?,?,?,?)', [lesson, state, worksheet, request.session.student_number, request.session.name, detail], function (error, results2, fields) {
        if (error) {
            response.send('Error 404 data not found.');
        } else {
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
                            var result = [
                                {
                                    sheet: '1',
                                    student_number: 'No data',
                                    username: 'No data',
                                    detail: 'No data'
                                }];
                        }
                        response.render('./lesson/01/lesson01-2-2.ejs', { result: result });
                    });
                });
            } else if (state == 3) {
                connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                    response.render('./lesson/01/lesson01-successcomment.ejs');
                });
            } else {
                connection.query('UPDATE result SET status_number = status_number + 1 WHERE student_number = ?', [request.session.student_number], function (error, results2, fields) {
                    response.render('./lesson/01/lesson01-successcomment.ejs');
                    /*connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 4', function (error, results, fields) {
                        if (results.length > 0) {
                            var result = results;
                        } else {
                            var result = [
                                {
                                    sheet: 1,
                                    student_number: 'No data',
                                    username: 'No data',
                                    detail: 'No data'
                                }, {
                                    sheet: 2,
                                    student_number: 'No data',
                                    username: 'No data',
                                    detail: 'No data'
                                }];
                        }
                        response.render('./lesson/01/lesson01-successcomment.ejs');
                    });*/
                });
            }
        }
    });
});

//======= lesson01 =======
app.get('/detail01', function (request, response) {
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck == 1) {
            response.render('./lesson/01/detail01.ejs');
        } else {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        }
    });
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

app.get('/lesson01-1-revise', function (request, response) {
    var random_page = Math.floor(Math.random() * 5) + 1;
    switch (random_page) {
        case 1:
            response.render('./lesson/01/lesson01-1-w6.ejs');
            break;
        case 2:
            response.render('./lesson/01/lesson01-1-w7.ejs');
            break;
        case 3:
            response.render('./lesson/01/lesson01-1-w8.ejs');
            break;
        case 4:
            response.render('./lesson/01/lesson01-1-w9.ejs');
            break;
        case 5:
            response.render('./lesson/01/lesson01-1-w10.ejs');
            break;
        default:
            response.render('./lesson/01/lesson01-1-w6.ejs');
    }
});
app.get('/lesson01-1-2', function (request, response) {
    response.render('./lesson/01/lesson01-1-2.ejs');
});
app.get('/lesson01-1-3', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 1', function (error, sheets, fields) {
        if (sheets.length > 0) {
            
        } else {

        }
        response.render('./lesson/01/lesson01-1-3.ejs', { result: sheets });
    });
});
app.get('/lesson01-secondtest', function (request, response) {
    response.render('./lesson/01/lesson01-secondtest.ejs');
});
app.get('/lesson01-2-1', function (request, response) {
    response.render('./lesson/01/lesson01-2-1.ejs');
});
app.get('/lesson01-2-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 2', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = [
                {
                    sheet: '1',
                    username: 'No data',
                    detail: 'No data'
                }];
        }
        response.render('./lesson/01/lesson01-2-2.ejs', { result: result });
    });
});
app.get('/lesson01-thirdtest', function (request, response) {
    response.render('./lesson/01/lesson01-thirdtest.ejs');
});

app.get('/lesson01-3-1', function (request, response) {
    response.render('./lesson/01/lesson01-3-1.ejs');
});
app.get('/lesson01-3-2', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 3', function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = [
                {
                    sheet: 1,
                    student_number: 'No data',
                    username: 'No data',
                    detail: 'No data'
                }, {
                    sheet: 2,
                    student_number: 'No data',
                    username: 'No data',
                    detail: 'No data'
                }];
        }
        response.render('./lesson/01/lesson01-3-2.ejs', { result: result });
    });
});
app.get('/lesson01-fourthtest', function (request, response) {
    response.render('./lesson/01/lesson01-fourthtest.ejs');
});
app.get('/lesson01-4-1', function (request, response) {
    connection.query('SELECT * FROM sheetcomment WHERE lesson = 1 AND state = 4 AND student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results.length > 0) {
            var result = results;
        } else {
            var result = [
                {
                    sheet: 1,
                    student_number: 'No data',
                    username: 'No data',
                    detail: 'No data'
                }, {
                    sheet: 2,
                    student_number: 'No data',
                    username: 'No data',
                    detail: 'No data'
                }];
        }
        response.render('./lesson/01/lesson01-4-1.ejs', { result: result });
    });
});

//======= lesson02 =======
app.get('/detail02', function (request, response) {
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck == 2) {
            response.render('./lesson/02/detail02.ejs');
        } else {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        }
    });
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
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck == 3) {
            response.render('./lesson/detail03.ejs');
        } else {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        }
    });
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
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck == 4) {
            response.render('./lesson/detail04.ejs');
        } else {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        }
    });
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
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck == 5) {
            response.render('./lesson/detail05.ejs');
        } else {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        }
    });
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
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck == 6) {
            response.render('./lesson/detail06.ejs');
        } else {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        }
    });
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
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck == 7) {
            response.render('./lesson/detail07.ejs');
        } else {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        }
    });
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
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck == 8) {
            response.render('./lesson/detail08.ejs');
        } else {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        }
    });
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
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck == 9) {
            response.render('./lesson/detail09.ejs');
        } else {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        }
    });
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
    connection.query('SELECT * FROM result WHERE student_number = ?', [request.session.student_number], function (error, results, fields) {
        if (results[0].statecheck == 10) {
            response.render('./lesson/detail10.ejs');
        } else {
            connection.query('SELECT * FROM controller', function (error, results, fields) {
                response.render('./user/selectlesson.ejs', { result: results });
            });
        }
    });
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