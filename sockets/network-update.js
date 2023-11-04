const io = require('../index.js').io;
const db = require('../node_mysql.js').db;
const cfg = require('../config.js');
const startGame = require('./game-script.js').startGame;

var func_list = [];
var connected_players = {};

func_list.push({
	event: "player-connect",

	func: (socket, data) => {
		function direct(player, room) {
			socket.emit("connected", {id: player.id, room: room.id, money: 25, username: player.username});

			let player_list = room.players_list+"&"+player.id;
			player_list = player_list.split("&").slice(1);
			let player_ammount = room.player_ammount.split("/");
			player_ammount[0] = player_list.length;
			let new_player_ammount = `${player_ammount[0]}/${player_ammount[1]}`;
			let new_playes_list = String(room.players_list).replace("undefined", "") + "&" + player.id;

			io.to(`room-${room.id}`).emit("get-player-ammount", {players_ammount: new_player_ammount});
			socket.leave("search");
			socket.join(`room-${room.id}`);

			io.to("search").emit("update-rooms", {
				id: room.id,
				player_ammount: new_player_ammount,
				type: "update"
			});

			db.updata({
				table: 'rooms',
				where: {id: room.id},
				colamns: {
					player_ammount: new_player_ammount,
					players_list: new_playes_list
				}
			});
		}

		db.insert_into({
			table: "connects",
			socket_id: socket.id,
			username: "random-"+socket.id,
			color: cfg.colours[Math.floor(Math.random() * cfg.colours.length)],
			room: data.room,
			money: 25,
			tiles: '{"nothing": "smile"}',
			backpack: "{}"
		}, (err, rows, field) => {
			db.select({table: "connects", socket_id: socket.id}, (err, player, field) => {
				db.select({table: "rooms", id: data.room}, (err, room, field) => {
					direct(player[0], room[0]);
				});
			});
		});
	}
});

func_list.push({
	event: "player-disconnect",

	func: (socket, data) => {
		function direct(player, room) {
			let player_list = room.players_list.split("&").slice(1);
			let player_ammount = room.player_ammount.split("/");
			player_ammount[0] = player_list.length-1;
			let new_player_ammount = `${player_ammount[0]}/${player_ammount[1]}`;
			let new_playes_list = room.players_list.replace("&" + player.id, "");

			io.to(`room-${room.id}`).emit("get-player-ammount", {players_ammount: new_player_ammount});
			io.to("search").emit("update-rooms", {id: room.id, player_ammount: new_player_ammount, type: "update"});
			
			if (player_ammount[0] == 0) {
				io.to("search").emit("update-rooms", {id: room.id, type: "delete"});

				db.delete({
					table: "rooms",
					id: room.id
				});
				return;
			}				

			db.updata({
				table: 'rooms',
				where: {id: room.id},
				colamns: {
					player_ammount: new_player_ammount,
					players_list: new_playes_list
				}
			});
		}

		db.select({table: "connects", socket_id: socket.id}, (err, player, field) => {
			db.select({table: "rooms", id: data.room}, (err, room, field) => {
				direct(player[0], room[0]);

				db.delete({
					table: "connects",
					id: player[0].id
				});
				socket.emit("player-was-disconnected", {});
			});
		});
	}
});
module.exports.func_list = func_list