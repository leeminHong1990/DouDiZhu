"use strict";
/*-----------------------------------------------------------------------------------------
												interface
-----------------------------------------------------------------------------------------*/
var impPlaybackOperation = impRoomOperation.extend({
	__init__: function () {
		this._super();
	},

	_createGameRoom: function (roomInfo, serverSitNum) {
		let initRoomInfo = roomInfo['init_info'];
		this.curGameRoom = new GameRoomEntity(initRoomInfo['player_num']);
		this.curGameRoom.updateRoomData(initRoomInfo);
		this.serverSitNum = serverSitNum;
		this.curGameRoom.playerStateList = roomInfo["player_state_list"];
		this.curGameRoom.startGame();
		this.curGameRoom.curRound = this.curGameRoom.curRound - 1;
		let dealerIdx = initRoomInfo['dealerIdx'];
		this.curGameRoom.curPlayerSitNum = dealerIdx;
		this.curGameRoom.dealerIdx = dealerIdx;
		this.curGameRoom.hostCards = roomInfo["host_cards"];
		// this.curGameRoom.op_record_list = roomInfo['op_record_list'] ? cutil.deepCopy(roomInfo['op_record_list']) : undefined;
		this.curGameRoom.op_record_list = JSON.parse(roomInfo['op_record_list']);
		// this.curGameRoom.op_special_record_list = roomInfo['op_special_record_list'] ? cutil.deepCopy(roomInfo['op_special_record_list']) : undefined;

		var init_tiles = roomInfo['init_tiles'] ? cutil.deepCopy(roomInfo['init_tiles']) : undefined;
		this.curGameRoom.handTilesList = [];
		for (var i = 0; i < init_tiles.length; i++) {
			this.curGameRoom.handTilesList[i] = init_tiles[i];
		}
		this.curGameRoom['round_result'] = roomInfo['round_result'];
	},

	_convertJsonValues: function (json_data) {
		let init_info = json_data['init_info'];
		for (var i = 0; i < init_info["player_base_info_list"].length; i++) {
			// Note: 回放时认为玩家全都是在线的
			init_info["player_base_info_list"][i].online = 1
		}
	},

	_findServerSitNum: function (id_list) {
		let uid = h1global.entityManager.player().userId;
		for (var i = 0; i < id_list.length; i++) {
			if (id_list[i] == uid) {
				return i;
			}
		}
		return 0;
	},

	reqPlayback: function (recordId) {
		let data = cc.sys.localStorage.getItem(const_val.GAME_NAME + 'record_' + recordId);
		if (data && cc.isString(data) && data.length > 0) {
			let info = JSON.parse(data);
			if (parseInt(info['recordId']) == recordId) {
				this._convertJsonValues(info);
				this.playbackGame(info);
				return;
			}
		}
		this.baseCall('queryRecord', recordId);
		cutil.lock_ui();
	},

	queryRecordResult: function (json_str) {
		let scene = cc.director.getRunningScene();
		if (scene.className === 'GameRoomScene') {
			return;
		}
		let info = JSON.parse(json_str);
		cc.sys.localStorage.setItem(const_val.GAME_NAME + 'record_' + info['recordId'], json_str);
		cutil.unlock_ui();
		this._convertJsonValues(info);
		this.playbackGame(info);
	},

	queryRecordFailed: function (code) {
		cc.log('queryRecordFailed', code);
		let scene = cc.director.getRunningScene();
		if (scene.className === 'GameRoomScene') {
			return;
		}
		cutil.unlock_ui();
		h1global.globalUIMgr.info_ui.show_by_info("回放码错误！");
	},

	playbackGame: function (roomInfo) {
		cc.log("playbackGame", roomInfo);
		this.runMode = const_val.GAME_ROOM_PLAYBACK_MODE;
		this.originRoomInfo = roomInfo;
		this._createGameRoom(roomInfo, this._findServerSitNum(roomInfo['player_id_list']));
		h1global.runScene(new PlaybackGameRoomScene());
	},

	replayGame: function (callback) {
		if (!this.originRoomInfo) {
			cc.error("replay game: room info undefined");
			return;
		}
		cc.log("replay game");
		this._createGameRoom(this.originRoomInfo, this._findServerSitNum(this.originRoomInfo['player_id_list']));
		if (h1global.curUIMgr.roomLayoutMgr) {
			if (h1global.curUIMgr.gameroom3d_ui || h1global.curUIMgr.gameroom2d_ui) {
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("hide");
				h1global.curUIMgr.roomLayoutMgr.startGame(function (complete) {
					if (complete) {
						if (callback) {
							callback();
						}
					}
				});
			}
		}
	}

});
