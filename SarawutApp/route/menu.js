module.exports = {
    login: (request,response) => {
        response.render('login.ejs');
    },

    loginprofile: (request,response) => {
        response.render('loginprofile.ejs');
    },

    logincheckresult: (request,response) => {
        response.render('logincheckresult.ejs');
    },

    report: (request, response) => {
        response.render('report.ejs');
    },

    checkresult: (request, response) => {
        response.render('checkresult.ejs');
    },

    systeminfo: (request, response) => {
        response.render('learningsysteminfo.ejs');
    },

    info: (request, response) => {
        response.render('creatureinfo.ejs');
    },

    userprofile: (request, response) => {
        response.render('userprofile.ejs');
    },

    qa: (request, response) => {
        response.render('qa.ejs');
    }
}