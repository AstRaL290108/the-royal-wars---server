const io = require('../index.js').io;
const db = require('../node_mysql.js').db;
const map_reader = require('./game-script.js').mapReader;
const cfg = require('../config.js');

var func_list = [];

func_list.push({
	event: "search",

	func: (socket, data) => {
		
	}
});

func_list.push({
	event: "create-room",

	func: (socket, data) => {
		let map_title = cfg.map_titles[Math.floor(Math.random() * cfg.map_titles.length)];
		let map = map_reader(map_title);
		let attraction = {creater: socket.id}

		db.insert_into({
			table: "rooms",
			title: data.title,
			players_list: "",
			player_ammount: `0/${data.max_player}`,
			state: "wait",
			attraction: JSON.stringify(attraction),
			tiles: JSON.stringify(map)
		}, (err, rows, field) => {
			db.select({table: "rooms", title: data.title}, (err, rooms, field) => {
				for (let i = 0; i < rooms.length; i++) {
					let item = rooms[i];
					if (attraction.creater == item.attraction.creater)
						socket.emit("room-was-created", {room: item.id});
				}
			});
		});
	}
});

module.exports.func_list = func_list