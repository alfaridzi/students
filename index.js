var express = require('express')
var mysql = require('mysql');
var app = express();
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var path = __dirname + '/views/';

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database : 'db_student'
});

var sessionStore = new MySQLStore({},connection);
 
app.use(session({
    secret: 'jX9ipokl7',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

connection.connect();

function authenticationMiddleware() {
	return(req,res,next) => {
		if(req.isAuthenticated()) return next();
		res.redirect('/');
	}
}

function notAuthenticationMiddleware() {
	return(req,res,next) => {
		if(!req.isAuthenticated()) return next();
		res.redirect('/home')
	}
}

app.get('/',notAuthenticationMiddleware(), function(req,res) {
	bcrypt.hash('123456', 10, function(err, hash) {
    if (err) { throw (err); }
    bcrypt.compare('123456', hash, function(err, result) {
        if (err) { throw (err); }
    });
});
	res.sendFile(path + 'login.html');
})

app.post('/login', passport.authenticate('local', {
	successRedirect: '/home',
	failureRedirect: '/'
}));

app.get('/home', authenticationMiddleware(), function(req,res) {
	res.sendFile(path + 'home.html');
})

passport.use(new LocalStrategy(
  function(username, password, done) {
     connection.query('select password, student_id from tbl_data where username = ?', [username], function(err,results, fields) {
     	if(err) {done(err)};
     	if(results.length === 0) {
     		done(null, false,{ message: 'Incorrect password.' })
     	} else {
     		const hash = results[0].password.toString();
	     	bcrypt.compare(password, hash, function(err, response) {
	     		if(response === true) {
	     			return done(null, {user_id: results[0].student_id.toString()});
	     		} else {
	     			return done(null, false);
	     		}
	     	});
     	}
     })
  }
));

passport.serializeUser(function(user_id, done) {
	done(null, user_id);
});
passport.deserializeUser(function(user_id, done) {
	done(null, user_id);
});


app.get('/students', authenticationMiddleware(), function(req,res) {
	connection.query('Select * from tbl_data', function(err, rows) {
		res.json(rows);
	});
});

app.get('/students/:student_id', authenticationMiddleware(), function(req, res) {
	var student_id = req.params.student_id;
	connection.query('Select * from tbl_data where student_id = ' + student_id, function(err, rows) {
		res.json(rows);
	});
});

app.get('/students/age/bio', authenticationMiddleware(), function(req,res) {
	connection.query('select student_age, student_bio from tbl_data', function(err,rows) {
		res.json(rows);
	});
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3000, () => console.log('running on port 3000...'))