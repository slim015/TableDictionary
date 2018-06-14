var mysql = require('mysql');
var express = require('express');
var handlebars = require('express-handlebars');
var app = express();

require('dotenv').load();

app.use(express.static(__dirname + '/public'));
app.engine('html', handlebars({ extname: '.html' }));
app.set("view engine", "html");
app.set('views', __dirname + '/views');

var parser = {
    body: require('body-parser')
};
app.use(parser.body.urlencoded({ extended: true }));
app.use(parser.body.json());

app.get('/', function(req, res){
	var connection = mysql.createConnection({
		host     : process.env.HOST_NAME,
		user     : process.env.DB_USER,
		password : process.env.DB_PASSWORD,
		database : process.env.DB_NAME,
		multipleStatements: true
	});

	connection.connect();

	connection.query('show tables from ' + process.env.DB_NAME + '; show columns from `Account_`; ' + 
		'SELECT TABLE_NAME as TableName FROM INFORMATION_SCHEMA.COLUMNS  WHERE TABLE_SCHEMA="' + process.env.DB_NAME + '" AND COLUMN_NAME = "accountId";', 
		function(err, results, fields){
		if (err) throw err;

		res.render('home', { tableName: results[0], fields: results[1], references: results[2] });
	});

	connection.end();
});

app.post('/', function(req, res){
	var pool = mysql.createPool({
		host     : process.env.HOST_NAME,
		user     : process.env.DB_USER,
		password : process.env.DB_PASSWORD,
		database : process.env.DB_NAME,
	});

	pool.getConnection(function(err, connection){
		connection.query('show columns from ' + '`' + req.body.name + '`' + ';', function(err, results, fields){
			if (err) connection.release();
			var flag = false;
			for (var i in results){
				if (results[i].Key == 'PRI'){
					connection.query('SELECT TABLE_NAME as TableName FROM INFORMATION_SCHEMA.COLUMNS  WHERE TABLE_SCHEMA="' + process.env.DB_NAME + '" AND COLUMN_NAME = "' + 
						results[i].Field + '"; ', function(err, refs, fields){
						if (err) throw err;	
						res.send({ fields: results, references: refs });
						connection.release();
					});
				}
			}
		});
	});
});

app.listen(5000, function(){
	console.log('Listening on port 5000');
});