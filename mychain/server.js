const path = require('path');
const express = require('express')
const bodyParser = require('body-parser')
const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

// const hbs = require('hbs');

// app.set('view engine', 'html');
// app.engine('html', hbs.__express);

app.listen(8080, () => {
	console.log('listening on port: 8080')
});

const routes = require('./router.js')(app);
