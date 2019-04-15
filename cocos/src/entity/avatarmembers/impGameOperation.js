"use strict";
/*-----------------------------------------------------------------------------------------
												interface
-----------------------------------------------------------------------------------------*/
var impGameOperation = impCommunicate.extend({
	__init__: function () {
		this._super();
		this.runMode = const_val.GAME_ROOM_GAME_MODE;
		this.startActions = {};
		KBEngine.DEBUG_MSG("Create impRoomOperation");
	},

	startGame: function (currentIdx, tileList, hostCards, swap_list) {
		cc.log("startGame");
		cc.log(currentIdx, tileList, hostCards, swap_list);
		var self = this;
		if (!this.curGameRoom) {
			return;
		}
		//交换位置 玩家当前在服务端的位置也改变
		var enterPlayerInfoList = cutil.deepCopy(this.curGameRoom.playerInfoList);
		cc.log(enterPlayerInfoList);
		this.serverSitNum = swap_list.indexOf(this.serverSitNum);
		this.curGameRoom.swap_seat(swap_list);
		this.curGameRoom.curPlayerSitNum = currentIdx;
		this.curGameRoom.canContinue = null;
		this.curGameRoom.dealerIdx = -1;
		this.runMode = const_val.GAME_ROOM_GAME_MODE;
		this.curGameRoom.hostCards = hostCards;
		this.curGameRoom.startGame();
		let startTilesList = cutil.deepCopy(this.curGameRoom.handTilesList);
		startTilesList[this.serverSitNum] = tileList.concat([]);
		startTilesList[this.serverSitNum].sort(rules.poker_compare2);
		cc.log("startGame", startTilesList[this.serverSitNum]);

		this.curGameRoom.handTilesList[this.serverSitNum] = tileList;
		this.curGameRoom.handTilesList[this.serverSitNum].sort(rules.poker_compare2);

		if (h1global.curUIMgr && h1global.curUIMgr.gameroomprepare_ui) {
			h1global.curUIMgr.gameroomprepare_ui.hide();
            h1global.curUIMgr.roomLayoutMgr.notifyObserver("init_game_info_panel");
            h1global.curUIMgr.roomLayoutMgr.notifyObserver("show_cover_cards_panel");
            h1global.curUIMgr.roomLayoutMgr.notifyObserver("init_player_wait_panel");
		}

		this.startActions["GameRoomUI"] = function () {
			if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr) {
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("startBeginAnim", startTilesList[self.serverSitNum], self.serverSitNum, self.curGameRoom);
			}
			h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_dealer_idx", self.curGameRoom.dealerIdx);
			if (onhookMgr && self.curGameRoom.op_seconds > 0) {
				onhookMgr.setWaitLeftTime(self.curGameRoom.op_seconds + const_val.BEGIN_ANIMATION_TIME)
			} else if (onhookMgr && const_val.FAKE_COUNTDOWN > 0) {
				onhookMgr.setWaitLeftTime(const_val.FAKE_COUNTDOWN + const_val.FAKE_BEGIN_ANIMATION_TIME);
			}
			// cc.audioEngine.playEffect("res/sound/effect/saizi_music.mp3");
		};

		if (this.curGameRoom.curRound <= 1) {
			this.startActions["GameRoomScene"] = function () {
				if (h1global.curUIMgr && h1global.curUIMgr.gameroominfo_ui) {
					if (h1global.curUIMgr.gameroominfo_ui.is_show) {
						h1global.curUIMgr.gameroominfo_ui.hide();
					}
					h1global.curUIMgr.gameroominfo_ui.show();
				}
				if (const_val.SHOW_SWAP_SEAT) {
					if (h1global.curUIMgr && h1global.curUIMgr.gameroomprepare_ui && !h1global.curUIMgr.gameroomprepare_ui.is_show) {
						// h1global.curUIMgr.gameroomprepare_ui.show_prepare(0, enterPlayerInfoList, function () {
						//     for(var i=0; i< self.curGameRoom.playerInfoList.length; i++){
						//         h1global.curUIMgr.gameroomprepare_ui.update_player_info_panel(i, self.curGameRoom.playerInfoList[i]);
						//     }
						// })

						h1global.curUIMgr.gameroomprepare_ui.show_prepare(0, enterPlayerInfoList, function () {
							h1global.curUIMgr.gameroomprepare_ui.swap_seat(swap_list);
						})
					}
				} else {
					if (const_val.SHOW_GPSUI) {
						if (h1global.curUIMgr && h1global.curUIMgr.gps_ui) {
							h1global.curUIMgr.gps_ui.show_by_start(self, self.curGameRoom);
						}
					} else {
						h1global.curUIMgr.roomLayoutMgr.startGame(function (complete) {
							if (complete && self.startActions["GameRoomUI"]) {
								self.startActions["GameRoomUI"]();
								self.startActions["GameRoomUI"] = undefined;
							}
						});
					}
				}
			}
		}
		if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr) {
			// 如果GameRoomScene已经加载完成
			if (this.startActions["GameRoomScene"]) {
				this.startActions["GameRoomScene"]();
				this.startActions["GameRoomScene"] = undefined;
			} else {
				h1global.curUIMgr.roomLayoutMgr.startGame(function (complete) {
					if (complete) {
						if (self.startActions["GameRoomUI"]) {
							self.startActions["GameRoomUI"]();
							self.startActions["GameRoomUI"] = undefined;
						}
					}
				});
			}
		}

		if (h1global.curUIMgr && h1global.curUIMgr.gameroominfo_ui && h1global.curUIMgr.gameroominfo_ui.is_show) {
			h1global.curUIMgr.gameroominfo_ui.update_round();
		}
		// if (h1global.curUIMgr && h1global.curUIMgr.gameconfig_ui && h1global.curUIMgr.gameconfig_ui.is_show) {
		//     h1global.curUIMgr.gameconfig_ui.update_state();
		// }

		if (h1global.curUIMgr && h1global.curUIMgr.config_ui && h1global.curUIMgr.config_ui.is_show) {
			h1global.curUIMgr.config_ui.update_state();
		}
		// 关闭结算界面
		if (h1global.curUIMgr && h1global.curUIMgr.settlement_ui) {
			h1global.curUIMgr.settlement_ui.hide();
		}
		if (h1global.curUIMgr && h1global.curUIMgr.result_ui) {
			h1global.curUIMgr.result_ui.hide();
		}
	},

	redeal: function (currentIdx, tileList, hostCards) {
		cc.log("redeal", tileList, hostCards);
		if (!this.curGameRoom) {
			return;
		}
		this.curGameRoom.curPlayerSitNum = currentIdx;
		this.curGameRoom.hostCards = hostCards;
		this.curGameRoom.startGame();
		this.curGameRoom.curRound--; // 重新发牌局数不需要叠加
		this.curGameRoom.handTilesList[this.serverSitNum] = tileList;
		this.curGameRoom.handTilesList[this.serverSitNum].sort(rules.poker_compare2);

		let curGameRoom = this.curGameRoom;
		if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr) {
			h1global.curUIMgr.roomLayoutMgr.notifyObserver("hide_dealer_txt_panel");
			h1global.curUIMgr.roomLayoutMgr.notifyObserver("redeal", curGameRoom);
			h1global.curUIMgr.roomLayoutMgr.notifyObserver("startBeginAnim", tileList, this.serverSitNum, curGameRoom);
            h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_game_info_panel",currentIdx);
		}
		if (onhookMgr && this.curGameRoom.op_seconds > 0) {
			onhookMgr.setWaitLeftTime(this.curGameRoom.op_seconds + const_val.BEGIN_ANIMATION_TIME)
		} else if (onhookMgr && const_val.FAKE_COUNTDOWN > 0) {
			onhookMgr.setWaitLeftTime(const_val.FAKE_COUNTDOWN + const_val.FAKE_BEGIN_ANIMATION_TIME);
		}
		// cc.audioEngine.playEffect("res/sound/effect/saizi_music.mp3");
	},

	readyForNextRound: function (serverSitNum) {
		if (!this.curGameRoom) {
			return;
		}
		this.curGameRoom.updatePlayerState(serverSitNum, 1);
		if (!h1global.curUIMgr) {
			return;
		}
		if (h1global.curUIMgr.gameroomprepare_ui && h1global.curUIMgr.gameroomprepare_ui.is_show) {
			h1global.curUIMgr.gameroomprepare_ui.update_player_state(serverSitNum, 1);
		}
		if (h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
			let index = this.server2CurSitNum(serverSitNum);
			h1global.curUIMgr.roomLayoutMgr.iterUI(function (ui) {
				if (!ui.playResultAnim) {
					ui.update_player_ready_state(serverSitNum, 1);
					ui.hide_player_desk_panel(index);
				}
			});
		}
		// if (h1global.curUIMgr.gameconfig_ui && h1global.curUIMgr.gameconfig_ui.is_show) {
		//     if (serverSitNum === this.serverSitNum) {
		//         h1global.curUIMgr.gameconfig_ui.update_state();
		//     }
		// }

		if (h1global.curUIMgr && h1global.curUIMgr.config_ui && h1global.curUIMgr.config_ui.is_show) {
			if (serverSitNum === this.serverSitNum) {
				h1global.curUIMgr.config_ui.update_state();
			}
		}
	},

	postMultiOperation: function (idx_list, aid_list, tile_list) {
		// 用于特殊处理多个人同时胡牌的情况
		if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
			for (var i = 0; i < idx_list.length; i++) {
				// h1global.curUIMgr.roomLayoutMgr.notifyObserver("playOperationEffect", const_val.OP_KONG_WIN, idx_list[i]);
			}
		}
		// if(this.curGameRoom.playerInfoList[serverSitNum]["sex"] == 1){
		// 	cc.audioEngine.playEffect("res/sound/voice/male/sound_man_win.mp3");
		// } else {
		// cc.audioEngine.playEffect("res/sound/voice/female/sound_woman_win.mp3");
		// }
	},

	postOperation: function (serverSitNum, aid, data, nextServerSitNum) {
		cc.log("postOperation: ", serverSitNum, aid, data);
		if (!this.curGameRoom) {
			return;
		}
		var voice_root = "res/sound/voice/";
		if (h1global.curUIMgr && h1global.curUIMgr.gameroom3d_ui && h1global.curUIMgr.gameroom3d_ui.is_show &&
			h1global.curUIMgr.gameroom3d_ui.beginAnimPlaying) {
			// 开局动画播放过程中，如果收到操作，则马上停止播放动画
			h1global.curUIMgr.gameroom3d_ui.stopBeginAnim(this.serverSitNum, this.curGameRoom);
			this.startActions["GameRoomUI"] = undefined;
		}
		if (h1global.curUIMgr && h1global.curUIMgr.gameroom2d_ui && h1global.curUIMgr.gameroom2d_ui.is_show &&
			h1global.curUIMgr.gameroom2d_ui.beginAnimPlaying) {
			// 开局动画播放过程中，如果收到操作，则马上停止播放动画
			h1global.curUIMgr.gameroom2d_ui.stopBeginAnim(this.serverSitNum, this.curGameRoom);
			this.startActions["GameRoomUI"] = undefined;
		}
		//每次操作 改变时钟的位置
		if (h1global.curUIMgr && h1global.curUIMgr.gameroom2d_ui && h1global.curUIMgr.gameroom2d_ui.is_show) {
			h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_game_info_panel",nextServerSitNum);
		}


		if (aid === const_val.OP_PASS) {
			this.curGameRoom.curPlayerSitNum = nextServerSitNum;

			this.curGameRoom.discard_record.push([]);
            if (this.curGameRoom.discard_record.length > 3) {
                this.curGameRoom.discard_record.splice(0, 1);
            }

			this.showWaitOperationTime();
			if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
				// h1global.curUIMgr.roomLayoutMgr.notifyObserver("hide_player_desk_panel", this.server2CurSitNum(serverSitNum));
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_player_desk_tiles", serverSitNum, [], this.serverSitNum, this.curGameRoom);
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("hide_player_desk_panel", this.server2CurSitNum(nextServerSitNum));
				if (this.serverSitNum === nextServerSitNum) {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_operation_panel");
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("unlock_player_hand_tiles");
				} else {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("lock_player_hand_tiles");
				}
			}
			if (this.curGameRoom.playerInfoList[serverSitNum]["sex"] == 1) {
				cc.audioEngine.playEffect(voice_root + "male/pass1.mp3");
			} else {
				cc.audioEngine.playEffect(voice_root + "female/pass1.mp3");
			}
		} else if (aid === const_val.OP_FIGHT_DEALER) {
			if (this.curGameRoom.fight_dealer_mul_list[serverSitNum] === -1) {
				this.curGameRoom.fight_dealer_mul_list[serverSitNum] = data[0];
			} else if (this.curGameRoom.fight_dealer_mul_list[serverSitNum] === const_val.GET_DEALER_MUL && data[0] > 0 && !data[1]) {//这个!data[1] 用来判断最后一家抢庄成功的情况
				this.curGameRoom.fight_dealer_mul_list[serverSitNum] *= data[0];
			}
			this.curGameRoom.curPlayerSitNum = nextServerSitNum;
			this.showWaitOperationTime();
			if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_dealer_mul_panel", serverSitNum, data[0]);
                h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_multiple_panel");
				if (nextServerSitNum === this.serverSitNum) {
					let score = this.curGameRoom.fight_dealer_mul_list[nextServerSitNum];
					if (score === -1 || score === const_val.GET_DEALER_MUL) {
						h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_dealer_operation_panel");
					} else {
						h1global.curUIMgr.roomLayoutMgr.notifyObserver("hide_operation_panel");
					}
				} else {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("hide_operation_panel");
				}
				for (var i = 0; i < const_val.MAX_PLAYER_NUM; i++) {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_player_info_panel", i, this.curGameRoom.playerInfoList[i]);
				}

				if(collections.sum(this.curGameRoom.fight_dealer_mul_list) === 0){
					//
				}
            }

			if (this.curGameRoom.playerInfoList[serverSitNum]["sex"] == 1) {
				if (data[0] === const_val.GET_DEALER_MUL) {
					cc.audioEngine.playEffect(voice_root + "male/jiaodizhu.mp3");
				} else if (data[0] === const_val.FIGHT_DEALER_MUL) {
					cc.audioEngine.playEffect(voice_root + "male/qiangdizhu.mp3");
				} else if (data[0] === 0) {
					if (collections.max(this.curGameRoom.fight_dealer_mul_list) === const_val.GET_DEALER_MUL) {
						cc.audioEngine.playEffect(voice_root + "male/buqiang.mp3");
					} else {
						cc.audioEngine.playEffect(voice_root + "male/bujiao.mp3");
					}
				}
			} else {
				if (data[0] === const_val.GET_DEALER_MUL) {
					cc.audioEngine.playEffect(voice_root + "female/jiaodizhu.mp3");
				} else if (data[0] === const_val.FIGHT_DEALER_MUL) {
					cc.audioEngine.playEffect(voice_root + "female/qiangdizhu.mp3");
				} else if (data[0] === 0) {
					if (collections.max(this.curGameRoom.fight_dealer_mul_list) === const_val.GET_DEALER_MUL) {
						cc.audioEngine.playEffect(voice_root + "female/buqiang.mp3");
					} else {
						cc.audioEngine.playEffect(voice_root + "female/bujiao.mp3");
					}
				}
			}
		} else if (aid === const_val.OP_BET) {
			this.showWaitOperationTime();
			this.curGameRoom.curPlayerSitNum = nextServerSitNum;
			this.curGameRoom.bet_score_list[serverSitNum] = data[0];
			if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_bet_score_panel", serverSitNum, data[0], true);
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_dealer_operation_panel");
                h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_multiple_panel");
                if (collections.sum(this.curGameRoom.bet_score_list) === 0){
					//
				}
			}

			if (this.curGameRoom.playerInfoList[serverSitNum]["sex"] == 1) {
				if (data[0] === 0) {
					cc.audioEngine.playEffect(voice_root + "male/bujiao.mp3");
				} else {
					cc.audioEngine.playEffect(voice_root + "male/score" + data[0] + ".mp3");
				}
			} else {
				if (data[0] === 0) {
					cc.audioEngine.playEffect(voice_root + "female/bujiao.mp3");
				} else {
					cc.audioEngine.playEffect(voice_root + "female/score" + data[0] + ".mp3");
				}
			}
		} else if (aid === const_val.OP_EXCHANGE) {
			this.curGameRoom.handTilesList[serverSitNum] = data.slice(0);
			cc.error("not imp OP_EXCHANGE")
		} else if (aid === const_val.OP_CONFIRM_DEALER) {
			if (this.curGameRoom.game_mode === const_val.GAME_MODE_SCORE) {
				this.postOperation(serverSitNum, const_val.OP_BET, data, nextServerSitNum);
			} else {
				if(data[0]>2){data[1]=1;cc.log("只有最后一家抢庄成功的时候",data);}
				this.postOperation(serverSitNum, const_val.OP_FIGHT_DEALER, data, nextServerSitNum);
			}
			this.showWaitOperationTime();
			this.curGameRoom.dealerIdx = nextServerSitNum;
			this.curGameRoom.curPlayerSitNum = nextServerSitNum;
			this.curGameRoom.handTilesList[nextServerSitNum] = this.curGameRoom.handTilesList[nextServerSitNum].concat(this.curGameRoom.hostCards).sort(rules.poker_compare2);
			if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_dealer_idx", nextServerSitNum);
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("hide_dealer_txt_panel");
				// h1global.curUIMgr.roomLayoutMgr.notifyObserver("play_fight_dealer_anim", serverSitNum);
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_player_hand_tiles", nextServerSitNum, this.curGameRoom.handTilesList[nextServerSitNum]);
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_host_cards_panel", this.curGameRoom.hostCards);
                h1global.curUIMgr.roomLayoutMgr.notifyObserver("play_flip_anime", this.curGameRoom.hostCards);
				for (var i = 0; i < const_val.MAX_PLAYER_NUM; i++) {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_player_info_panel", i, this.curGameRoom.playerInfoList[i]);
				}
				if (this.serverSitNum === nextServerSitNum) {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("unlock_player_hand_tiles");
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_operation_panel");
				} else {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("lock_player_hand_tiles");
				}
			}
		} else if (aid === const_val.OP_DISCARD) {
			this.showWaitOperationTime();
			this.curGameRoom.curPlayerSitNum = nextServerSitNum;
			this.curGameRoom.last_discard_idx = serverSitNum;
			this.curGameRoom.discard_record.push(data);
			if (this.curGameRoom.discard_record.length > 3) {
				this.curGameRoom.discard_record.splice(0, 1);
			}
			if (this.curGameRoom.boom_times < this.curGameRoom.max_boom_times && (rules.is_pair4(data, false, false)[0] || rules.is_pair_joker(data)[0])) {
				this.curGameRoom.boom_times++;
				if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_boom_times", this.curGameRoom.boom_times);
				}
			}
			let handTilesList = this.curGameRoom.handTilesList[serverSitNum];
			if (this.serverSitNum === serverSitNum || this.runMode === const_val.GAME_ROOM_PLAYBACK_MODE) {
				collections.removeArray(handTilesList, data);
			} else {
				handTilesList.splice(0, data.length);
			}
			if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_player_hand_tiles", serverSitNum, handTilesList);
                for (var i = 0; i < const_val.MAX_PLAYER_NUM; i++) {
                    h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_player_info_panel", i, this.curGameRoom.playerInfoList[i]);
                }
			}
			if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
				if (this.serverSitNum === nextServerSitNum) {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_operation_panel");
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("unlock_player_hand_tiles");
				} else {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("lock_player_hand_tiles");
				}
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_player_desk_tiles", serverSitNum, data, this.serverSitNum, this.curGameRoom);
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("hide_player_desk_panel", this.server2CurSitNum(nextServerSitNum));
			}
			if (handTilesList.length === 2) {
				if (this.curGameRoom.playerInfoList[serverSitNum]["sex"] == 1) {
					cc.audioEngine.playEffect(voice_root + "male/lastcard2.mp3");
				} else {
					cc.audioEngine.playEffect(voice_root + "female/lastcard2.mp3");
				}
			} else if (handTilesList.length === 1) {
				if (this.curGameRoom.playerInfoList[serverSitNum]["sex"] == 1) {
					cc.audioEngine.playEffect(voice_root + "male/lastcard1.mp3");
				} else {
					cc.audioEngine.playEffect(voice_root + "female/lastcard1.mp3");
				}
			} else {
				this.playDiscardSound(serverSitNum, data)
			}
		}
		// if (this.serverSitNum !== serverSitNum && h1global.curUIMgr.roomLayoutMgr) {
		//     h1global.curUIMgr.roomLayoutMgr.notifyObserver("hide_operation_panel");
		// }
	},

	playDiscardSound: function (serverSitNum, data) {
		var info = rules.test_with_rule(data);
		if (!info[0]) {
			return
		}
		var type = info[1];
		var voice_root = "res/sound/voice/";
		var soundName = null;
		if (type === rules.TYPE_SINGLE) {
			soundName = info[2];
		} else if (type === rules.TYPE_PAIR2) {
			soundName = "dui" + info[2];
		} else if (type === rules.TYPE_SEQ_PAIR2) {
			soundName = "liandui";
		} else if (type === rules.TYPE_SEQ_PAIR3_1 || type === rules.TYPE_SEQ_PAIR3_2) {
			soundName = "plane1";
		} else if (type === rules.TYPE_PAIR4) {
			soundName = "zhadan";
		} else if (type === rules.TYPE_PAIR_JOKER) {
			soundName = "wangzha";
		} else if (type === rules.TYPE_PAIR3) {
			soundName = "sanbudai";
		} else if (type === rules.TYPE_PAIR3_1) {
			soundName = "sandai1";
		} else if (type === rules.TYPE_PAIR3_2) {
			soundName = "sandai2";
		} else if (type === rules.TYPE_PAIR4_2_1 || type === rules.TYPE_PAIR4_2_2) {
			soundName = "sidai2";
		} else {
			return;
		}
		if (this.curGameRoom.playerInfoList[serverSitNum]["sex"] == 1) {
			cc.audioEngine.playEffect(voice_root + "male/" + soundName + ".mp3");
		} else {
			cc.audioEngine.playEffect(voice_root + "female/" + soundName + ".mp3");
		}
	},

	selfPostOperation: function (aid, data) {
		cc.log("selfPostOperation", aid, data);
		// 由于自己打的牌自己不需要经服务器广播给自己，因而只要在doOperation时，自己postOperation给自己
		// 而doOperation和postOperation的参数不同，这里讲doOperation的参数改为postOperation的参数
		var nextServerSitNum = null;
		if (aid === const_val.OP_PASS) {
			nextServerSitNum = (this.serverSitNum + 1) % this.curGameRoom.player_num;
		} else if (aid === const_val.OP_FIGHT_DEALER) {
			// Note: 此处计算的的next不对，但是现在这个操作不需要这个值
			nextServerSitNum = (this.serverSitNum + 1) % this.curGameRoom.player_num;
		} else if (aid === const_val.OP_BET) {
			nextServerSitNum = (this.serverSitNum + 1) % this.curGameRoom.player_num;
		} else if (aid === const_val.OP_DISCARD) {
			nextServerSitNum = (this.serverSitNum + 1) % this.curGameRoom.player_num;
		} else if (aid === const_val.OP_EXCHANGE) {

		} else if (aid === const_val.OP_CONFIRM_DEALER) {
		} else {
			cc.warn("unknown aid : " + aid);
		}
		// 用于转换doOperation到postOperation的参数
		this.postOperation(this.serverSitNum, aid, data, nextServerSitNum);
	},

	doOperation: function (aid, data) {
		cc.log("doOperation: ", aid, data);
		if (!this.curGameRoom) {
			return;
		}
		if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
			h1global.curUIMgr.roomLayoutMgr.notifyObserver("lock_player_hand_tiles");
		}
		// 自己的操作直接本地执行，不需要广播给自己
		this.selfPostOperation(aid, data);
		this.baseCall("doOperation", aid, data);
	},

	doOperationFailed: function (err) {
		cc.log("doOperationFailed: " + err.toString());
	},

	confirmOperation: function (aid, data) {
		cc.log("confirmOperation: ", aid, data);
		let curGameRoom = this.curGameRoom;
		if (!curGameRoom) {
			return;
		}
		let index = curGameRoom.waitAidList.indexOf(aid);
		if (index >= 0) {
			curGameRoom.waitAidList.splice(index, 1);
			curGameRoom.waitDataList.splice(index, 1);
			h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_operation_panel", this.getWaitOpDict(curGameRoom.waitAidList, curGameRoom.waitDataList, this.serverSitNum), const_val.SHOW_CONFIRM_OP)
		} else {
			cc.warn("confirmOperation invalid aid", curGameRoom.waitAidList);
			return;
		}
		// if (h1global.curUIMgr.isShow && h1global.curUIMgr.isShow()) {
		//     h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "lock_player_hand_tiles");
		// }
		// 自己的操作直接本地执行，不需要广播给自己
		this.selfPostOperation(aid, data);
		this.baseCall("confirmOperation", aid, data);
	},

	showWaitOperationTime: function () {
		if (onhookMgr && this.curGameRoom && this.curGameRoom.op_seconds > 0) {
			cc.log('showWaitOperationTime setWaitLeftTime=== > ', this.curGameRoom.op_seconds);
			onhookMgr.setWaitLeftTime(this.curGameRoom.op_seconds)
		} else if (onhookMgr && const_val.FAKE_COUNTDOWN > 0) {
			onhookMgr.setWaitLeftTime(const_val.FAKE_COUNTDOWN);
		}
	},

	waitForOperation: function (aid_list, data_list) {
		cc.log("waitForOperation", aid_list, data_list);
		if (!this.curGameRoom) {
			return;
		}
		this.curGameRoom.waitAidList = aid_list;
		this.curGameRoom.waitDataList = data_list;
		if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
			h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_operation_panel", this.getWaitOpDict(aid_list, data_list), const_val.SHOW_CONFIRM_OP);
		}
	},

	roundResult: function (roundRoomInfo) {
		if (!this.curGameRoom) {
			return;
		}
		cc.log("roundResult");
		cc.log(roundRoomInfo);
		this.curGameRoom.endGame();
		if (onhookMgr) {
			onhookMgr.setWaitLeftTime(null);
		}
		var playerInfoList = roundRoomInfo["player_info_list"];
		for (var i = 0; i < playerInfoList.length; i++) {
			let idx = playerInfoList[i]['idx'];
			this.curGameRoom.playerInfoList[idx]["score"] = playerInfoList[i]["score"];
			this.curGameRoom.playerInfoList[idx]["total_score"] = playerInfoList[i]["total_score"];
		}
		var self = this;

		// Note: 此处只在回放上
		var replay_func = undefined;
		if (self.runMode === const_val.GAME_ROOM_PLAYBACK_MODE) {
			replay_func = arguments[1];
		}

		let player = h1global.entityManager.player();
		var curGameRoom = player.curGameRoom;
		var serverSitNum = player.serverSitNum;

		function callbackfunc() {
			if (h1global.curUIMgr.settlement_ui) {
				if (self.runMode === const_val.GAME_ROOM_PLAYBACK_MODE) {
					h1global.curUIMgr.settlement_ui.show_by_info(roundRoomInfo, serverSitNum, curGameRoom, undefined, replay_func);
				} else {
					h1global.curUIMgr.settlement_ui.show_by_info(roundRoomInfo, serverSitNum, curGameRoom);
				}
			}
		}

		if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr) {
			if (h1global.curUIMgr.roomLayoutMgr.isShow()) {
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_all_player_score", playerInfoList);
                h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_multiple_panel",roundRoomInfo['spring'],1);
				h1global.curUIMgr.roomLayoutMgr.notifyObserverWithCallback("play_result_anim", callbackfunc, playerInfoList, roundRoomInfo['result_list'], curGameRoom, serverSitNum,roundRoomInfo['spring']);
			} else {
				h1global.curUIMgr.roomLayoutMgr.registerShowObserver(function () {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("hide_player_hand_tiles", self.serverSitNum);
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_all_player_score", playerInfoList);
                    h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_multiple_panel",roundRoomInfo['spring'],1);
					h1global.curUIMgr.roomLayoutMgr.notifyObserverWithCallback("play_result_anim", callbackfunc, playerInfoList, roundRoomInfo['result_list'], curGameRoom, serverSitNum,roundRoomInfo['spring']);
				})
			}
		} else {
			callbackfunc();
		}
	},

	resetRoom: function (roomInfo) {
		this.runMode = const_val.GAME_ROOM_GAME_MODE;
		this.curGameRoom = new GameRoomEntity(roomInfo['player_num']);
		this.curGameRoom.updateRoomData(roomInfo);
		// Note: 续房的时候房主退出房间的标记， 为了在房主退出时给其他玩家提示
		this.curGameRoom.canContinue = true;
		this.curGameRoom.playerStateList = roomInfo["player_state_list"];
		cutil.clearEnterRoom();
	},

	finalResult: function (finalPlayerInfoList, roundRoomInfo, continueRoomInfo) {
		cc.log("finalResult", continueRoomInfo);
		cc.log(finalPlayerInfoList);
		if (!this.curGameRoom) {
			return;
		}
		if (onhookMgr) {
			onhookMgr.setWaitLeftTime(null);
		}
		// Note: 为了断线重连后继续停留在总结算上，此处设置一个标志位作为判断
		if (h1global.curUIMgr && h1global.curUIMgr.result_ui) {
			h1global.curUIMgr.result_ui.finalResultFlag = true;
		}

		let curGameRoom = this.curGameRoom;
		let serverSitNum = this.serverSitNum;
		let canContinue = continueRoomInfo['continue_list'][serverSitNum] === const_val.ROOM_CONTINUE;

		var self = this;

		function callbackfunc(complete) {
			if (complete && h1global.curUIMgr.result_ui) {
				h1global.curUIMgr.settlement_ui.show_by_info(roundRoomInfo, serverSitNum, curGameRoom, function () {
					if (h1global.curUIMgr.result_ui) {
						h1global.curUIMgr.result_ui.show_by_info(finalPlayerInfoList, curGameRoom, serverSitNum, canContinue);
					}
				});
			}
			// Note: 此时的GameRoom已经是新创建的 更新游戏场不在房间的头像
			let newGameRoom = self.curGameRoom;
			if (h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
				for (var i = 0; i < const_val.MAX_PLAYER_NUM; i++) {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_player_info_panel", i, newGameRoom.playerInfoList[i])
				}
			}
		}

		if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr) {
			if (h1global.curUIMgr.roomLayoutMgr.isShow()) {
				h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_all_player_score", roundRoomInfo["player_info_list"]);
                h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_multiple_panel",roundRoomInfo['spring'],1);
				h1global.curUIMgr.roomLayoutMgr.notifyObserverWithCallback("play_result_anim", callbackfunc, roundRoomInfo["player_info_list"], roundRoomInfo['result_list'], curGameRoom, serverSitNum,roundRoomInfo['spring']);
			} else {
				h1global.curUIMgr.roomLayoutMgr.registerShowObserver(function () {
					h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_all_player_score", roundRoomInfo["player_info_list"]);
                    h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_multiple_panel",roundRoomInfo['spring'],1);
					h1global.curUIMgr.roomLayoutMgr.notifyObserverWithCallback("play_result_anim", callbackfunc, roundRoomInfo["player_info_list"], roundRoomInfo['result_list'], curGameRoom, serverSitNum,roundRoomInfo['spring']);
				})
			}
		} else {
			callbackfunc();
		}

		if (canContinue) {
			let initRoomInfo = continueRoomInfo['init_info'];
			this.resetRoom(initRoomInfo);
		}
	},

	subtotalResult: function (finalPlayerInfoList) {
		if (!this.curGameRoom) {
			return;
		}
		if (onhookMgr) {
			onhookMgr.setApplyCloseLeftTime(null);
		}

		if (h1global.curUIMgr && h1global.curUIMgr.applyclose_ui && h1global.curUIMgr.applyclose_ui.is_show) {
			h1global.curUIMgr.applyclose_ui.hide();
			onhookMgr.applyCloseLeftTime = 0;
		}
		if (h1global.curUIMgr && h1global.curUIMgr.settlement_ui && h1global.curUIMgr.settlement_ui.is_show) {
			h1global.curUIMgr.settlement_ui.hide()
		}
		// Note: 为了断线重连后继续停留在总结算上，此处设置一个标志位作为判断
		if (h1global.curUIMgr && h1global.curUIMgr.result_ui) {
			h1global.curUIMgr.result_ui.finalResultFlag = true;
		}
		var curGameRoom = this.curGameRoom;
		let serverSitNum = this.serverSitNum;
		if (h1global.curUIMgr && h1global.curUIMgr.result_ui) {
			h1global.curUIMgr.result_ui.show_by_info(finalPlayerInfoList, curGameRoom, serverSitNum, false);
		}
	},

	prepare: function () {
		if (!this.curGameRoom) {
			return;
		}
		this.baseCall("prepare");
	},

	notifyPlayerOnlineStatus: function (serverSitNum, status) {
		if (!this.curGameRoom) {
			return;
		}
		this.curGameRoom.updatePlayerOnlineState(serverSitNum, status);
		if (h1global.curUIMgr && h1global.curUIMgr.roomLayoutMgr && h1global.curUIMgr.roomLayoutMgr.isShow()) {
			h1global.curUIMgr.roomLayoutMgr.notifyObserver("update_player_online_state", serverSitNum, status);
		}
	},
});
