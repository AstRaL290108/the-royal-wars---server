const io = require('./index.js').io;

const menu = require('./sockets/menu.js').func_list;
const networkUpdate = require('./sockets/network-update.js').func_list;
const waiting = require('./sockets/waiting.js').func_list;
const gameScript = require('./sockets/game-script.js').func_list;

var all_func = [menu, networkUpdate, waiting, gameScript];

module.exports.func = function (socket) {
	for(let i = 0;i < all_func.length; i++) {
		let item = all_func[i];
		for (let e = 0; e < item.length; e++) {
			let ent = item[e];
			socket.on(ent.event, data => {ent.func(socket, data)});
		}
	}
}