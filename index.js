const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
module.exports.io = io;

const cookieParser = require('cookie-parser');

const render = require('./render.js').FuncList;
const backend = require('./backend.js').FuncList;
const socket_func = require('./socket.js').func;
const config = require('./config.js');


app.set("view engine", "ejs");
app.use(express.static(__dirname + "/static"));
app.use(express.urlencoded({extended: false}));
app.use(cookieParser('secret key'));


for (let i = 0; i < render.length; i++) {
	app.get(render[i].url, render[i].func);
}
for (let i = 0; i < backend.length; i++) {
	app.post(render[i].url, render[i].func);
}
io.on('connection', socket_func);


server.listen(config.port, () => {
	console.log(`Сервер запущен по адресу - http://localhost:${config.port}`);
});