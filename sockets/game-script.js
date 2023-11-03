const io = require('../index.js').io;
const db = require('../node_mysql.js').db;
const cfg = require('../config.js');

const fs = require('fs');

var func_list = [];

function mapReader(map_title) {
	let fileContent = fs.readFileSync(__dirname+`/../static/maps/${map_title}.txt`, 'utf8').toString().split("\n");

	var result = {};
	for (var i = 0; i < fileContent.length; i++) {
		let item = fileContent[i];
		for (var e = 0; e < item.length; e++) {
			if (e == 12) continue;
			let elmt = item[e];
			let tile_type = cfg.tiles_num[elmt];
			
			result[`${e}&${i}`] = `none&none&${tile_type}`;
		}
	}
	return result;
}

function playersLine(rows) {
	let all_players  = rows.players_list.slice(0);
	let ferst_player = rows.players_list.split("&")[1];

	for (let i = 0; i < all_players.split("&").length; i++) {
		let item = all_players.split("&")[i];
		if (item == "") continue;

		let x = Math.floor(Math.random() * 12);
		let y = Math.floor(Math.random() * 12);

		rows.tiles[`${x}&${y}`] = `${item}&сastle&${rows.tiles[`${x}&${y}`].split("&")[2]}`
	}

	return {
		tiles: rows.tiles,
		all_players: all_players,
		ferst_player: ferst_player 
	};
}

function setNowItemID(room_id) {
	for (let item = 0; item < cfg.item_types.length; item++) { 
		var type = cfg.item_types[item];
		return;
		db.select({table: "item", type: type}, (err, rows, field) => {
			var oneID = Math.floor(Math.random() * rows.length);
			if (oneID+1 >= rows.length) {var twoID = Math.abs(rows.length - oneID+1)}
			else {var twoID = oneID+1}

			if (oneID+2 >= rows.length) {var treeID = Math.abs(rows.length - oneID+2)}
			else {var treeID = oneID+2}

			oneID  = rows[oneID].id;
			twoID  = rows[twoID].id;
			treeID = rows[treeID].id;

			db.select({table: "rooms", id: room_id}, (err, room, field) => {
				let attraction = room[0].attraction;
				attraction[`sale_${type}`] = `${oneID}&${twoID}&${treeID}`;

				db.updata({
					table: 'rooms',
					where: {id: room_id},
					colamns: {attraction: JSON.stringify(attraction)}
				});
			});
		});
	}
}

function startGame(room_id) {
	db.select({table: "rooms", id: room_id}, (err, rows, field) => {
		rows = rows[0];
		let player = playersLine(rows);
		setNowItemID(room_id);


		let attraction = `{
			"move": "${player.all_players}",
			"now_move": "${player.ferst_player}",
			"using_arcane": "",
			"using_champion": "",
			"using_legend": "",
			"using_support": ""
		}`;


		db.updata({
			table: 'rooms',
			where: {id: room_id},
			colamns: {
				state: 'game',
				attraction: attraction,
				tiles: JSON.stringify(player.tiles)
			}
		});
	});
}


func_list.push({
	event: "game-ping",

	func: (socket, data) => {
		db.select({table: "rooms", id: data.room}, (err, rows, field) => {
			rows = rows[0];
			socket.emit('game-ping-responce', {
				tiles: rows.tiles, 
				money: 25, 
				now_move: rows.attraction.now_move
			});
		});
	}
});


func_list.push({
	event: "get-colours",

	func: (socket, data) => {
		db.select({table: "rooms", id: data.room}, (err, rows, field) => {
			rows = rows[0];
			for (let i = 0; i < rows.players_list.split("&").length; i++) {
				let item = rows.players_list.split("&")[i];
				if (item == "") continue;

				db.select({table: "connects", id: Number(item)}, (err, player, field) => {
					player = player[0];
					socket.emit("resp-color", {id: item, color: player.color});
				});
			}
		});
	}
});


func_list.push({
	event: "next-move",

	func: (socket, data) => {
		db.select({table: "rooms", id: data.room}, (err, rows, field) => {
			rows = rows[0];
			let attraction = rows.attraction;
			let now_move_index = attraction.move.split("&").indexOf(data.id);

			try {
				var now_move = attraction.move.split("&")[now_move_index + 1];
			}catch {
				var now_move = attraction.move.split("&")[1];
			}finally {
				rows.attraction.now_move = now_move;
				db.updata({
					table: 'rooms',
					where: {id: data.room},
					colamns: {
						attraction: JSON.stringify(rows.attraction)
					}
				});
				io.to(`room-${data.room}`).emit('reset-move', {
					now_move: rows.attraction.now_move,
				});
			}

		});
	}
});


func_list.push({
	event: "load-goods",

	func: (socket, data) => {
		db.select({table: "rooms", id: data.room}, (err, rows, field) => {
			rows = rows[0];
			let items = rows.attraction[`sale_${data.type}`].split("&");
			Array.from(items, itemID => {
				db.select({table: "item", id: itemID}, (err, item, field) => {
					socket.emit("get-goods", item[0]);
				});
			});

		});
	}
});


module.exports.func_list = func_list;
module.exports.mapReader = mapReader;
module.exports.startGame = startGame;