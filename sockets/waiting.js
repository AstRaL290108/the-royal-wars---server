const io = require('../index.js').io;
const db = require('../node_mysql.js').db;

var func_list = [];

func_list.push({
	event: "give-player-ammount",

	func: (socket, data) => {
		db.select({table: 'rooms', id: data.room}, (err, room, filed) => 
			socket.emit("get-player-ammount", {players_ammount: room[0].player_ammount}
		));
	}
});

func_list.push({
	event: "change-username",

	func: (socket, data) => {
		db.updata({
			table: 'connects',
			where: {id: data.id},
			colamns: {username: data.new_name}
		});
		socket.emit("name-was-changed", {new_name: data.new_name});
	}
});

func_list.push({
	event: "check-creater",

	func: (socket, data) => {
		db.select({table: 'rooms', id: data.room}, (err, room, filed) => {
			room = room[0];
			let creater = room.attraction.creater;

			if (creater == socket.id)
				socket.emit("check-creater-response", {});
		});
	}
});

module.exports.func_list = func_list