"use strict"
var SettlementUI = UIBase.extend({
    ctor: function () {
        this._super();
        this.resourceFilename = "res/ui/SettlementUI.json";
        this.setLocalZOrder(const_val.SettlementZOrder)
    },
    initUI: function () {
        var self = this;
        var confirm_btn = this.rootUINode.getChildByName("confirm_btn");

        function confirm_btn_event(sender, eventType) {
            if (eventType == ccui.Widget.TOUCH_ENDED) {
                // TEST:
                // self.hide();
                // h1global.curUIMgr.gameroomprepare_ui.show_prepare();
                // h1global.curUIMgr.notifyObserver("hide");
                // return;
                self.hide();

				//重新开局
                var player = h1global.player();
                if (player) {
                    player.curGameRoom.updatePlayerState(player.serverSitNum, 1);
                    h1global.curUIMgr.gameroomprepare_ui.show_prepare();
                    h1global.curUIMgr.roomLayoutMgr.notifyObserver("reset");
                    player.prepare();
                } else {
                    cc.warn('player undefined');
                }
            }
        }

        confirm_btn.addTouchEventListener(confirm_btn_event);

        //单局结算分享
        this.rootUINode.getChildByName("share_btn").addTouchEventListener(function (sender, eventType) {
            if (eventType == ccui.Widget.TOUCH_ENDED) {
                if ((cc.sys.os == cc.sys.OS_ANDROID && cc.sys.isNative)) {
                    jsb.fileUtils.captureScreen("", "screenShot.png");
                } else if ((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative)) {
                    jsb.reflection.callStaticMethod("WechatOcBridge", "takeScreenShot");
                } else {
                    h1global.curUIMgr.share_ui.show();
                }
            }
        });

        if ((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative) && switches.appstore_check == true) {
            this.rootUINode.getChildByName("share_btn").setVisible(false);
        }
    },

    setPlaybackLayout: function (replay_btn_func) {
        let replay_btn = ccui.helper.seekWidgetByName(this.rootUINode, "replay_btn");
        let self = this;
        replay_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                if (replay_btn_func) replay_btn_func();
                if (self.is_show) {
                    self.hide();
                }
            }
        });
        replay_btn.setVisible(true);
        let back_hall_btn = ccui.helper.seekWidgetByName(this.rootUINode, "back_hall_btn");
        back_hall_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                h1global.runScene(new GameHallScene());
            }
        });
        back_hall_btn.setVisible(true);

        ccui.helper.seekWidgetByName(this.rootUINode, "share_btn").setVisible(false);
        ccui.helper.seekWidgetByName(this.rootUINode, "confirm_btn").setVisible(false);
    },

    show_by_info: function (roundRoomInfo, serverSitNum, curGameRoom, confirm_btn_func, replay_btn_func) {
        cc.log("结算==========>:");
        cc.log("roundRoomInfo :  ", roundRoomInfo);
        var self = this;
        this.show(function () {
            //在这里更新场景
            self.player_tiles_panels = [];
            self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("player_panel_0"));
            self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("player_panel_1"));
            self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("player_panel_2"));
            var playerInfoList = roundRoomInfo["player_info_list"];
            // 需求 将玩家自己放在第一位
            var left = [];
            var right = [];
            for(let i=0; i<playerInfoList.length; i++){
                if (playerInfoList[i]["idx"] < serverSitNum){
                    left.push(playerInfoList[i])
                }else{
                    right.push(playerInfoList[i])
                }
            }
            playerInfoList = right.concat(left);
            for(var i = 0; i < 3; i++){
                var roundPlayerInfo = playerInfoList[i];
                var server_seat_num = roundPlayerInfo["idx"];
                if (!roundPlayerInfo) {
                    self.player_tiles_panels[i].setVisible(false);
                    continue
                }
                cc.log(roundPlayerInfo);
                self.player_tiles_panels[i].setVisible(true)
                self.update_score(i, roundPlayerInfo["score"]);  //显示分数
                self.update_mul(i,curGameRoom,roundPlayerInfo,roundRoomInfo["spring"]); //倍数
                self.update_player_hand_tiles(i,roundPlayerInfo["tiles"]);   //显示剩余牌
                self.update_player_info(i, server_seat_num, curGameRoom);  //idx 表示玩家的座位号
            }
            self.show_title(roundRoomInfo["player_info_list"][serverSitNum]["score"]);//更新赢家
            var confirm_btn = self.rootUINode.getChildByName("confirm_btn");
            var result_btn = self.rootUINode.getChildByName("result_btn");
            var share_btn = self.rootUINode.getChildByName("share_btn");
            if (confirm_btn_func) {
                self.rootUINode.getChildByName("result_btn").addTouchEventListener(function (sender, eventType) {
                    if (eventType == ccui.Widget.TOUCH_ENDED) {
                        self.hide();
                        confirm_btn_func();
                    }
                });
                confirm_btn.setVisible(false);
                result_btn.setVisible(true);
                share_btn.setVisible(true);
            } else if (replay_btn_func) {
                self.setPlaybackLayout(replay_btn_func)
            } else {
                confirm_btn.setVisible(true);
                result_btn.setVisible(false);
            }
        });
    },

    show_title: function (score) {
        var bg_img = this.rootUINode.getChildByName("settlement_panel").getChildByName("bg_img");
        var win_title = this.rootUINode.getChildByName("settlement_panel").getChildByName("win_title");
        win_title.ignoreContentAdaptWithSize(true);
        cc.log(parseInt(score));
        if (parseInt(score)>0) {
            //胜利
            bg_img.loadTexture("res/ui/SettlementUI/win_bg.png");
            win_title.loadTexture("res/ui/SettlementUI/win_title.png");
        } else {
            bg_img.loadTexture("res/ui/SettlementUI/fail_bg.png");
            win_title.loadTexture("res/ui/SettlementUI/fail_title.png");
        }
    },

    update_player_hand_tiles: function (panel_idx,tileList) {
        if (!this.is_show) {
            return;
        }
        var cur_player_tile_panel = this.player_tiles_panels[panel_idx].getChildByName("poker");
        if (!cur_player_tile_panel) {
            return;
        }
        if(tileList.length>0){
            this.player_tiles_panels[panel_idx].getChildByName("winner_img").setVisible(false);
            this.player_tiles_panels[panel_idx].getChildByName("poker").setVisible(true);

            for (var i = 0; i < const_val.DESK_CARD_NUM; i++) {
                let tile = cur_player_tile_panel.getChildByName('tile_img_' + i);
                let num = tileList[i];
                if (num > 0) {
                    tile.loadTexture(this._getCardImgPath(num), ccui.Widget.PLIST_TEXTURE);
                    tile.setVisible(true);
                } else {
                    tile.setVisible(false);
                }
            }
        }else{
            this.player_tiles_panels[panel_idx].getChildByName("winner_img").setVisible(true);
            this.player_tiles_panels[panel_idx].getChildByName("poker").setVisible(false);
        }
    },

    update_score:function(panel_idx, score){
        var score_label = this.player_tiles_panels[panel_idx].getChildByName("score_label");
        if(score >= 0){
            score_label.setTextColor(cc.color(235, 235, 13));
            score_label.setString("+" + score.toString());
        } else {
            score_label.setTextColor(cc.color(225, 225, 214));
            score_label.setString(score.toString());
        }
    },

    update_mul:function (panel_idx,curGameRoom,roundPlayerInfo,spring) {
        var multiple_list = cutil.change_fight_dealer_mul_list(curGameRoom.fight_dealer_mul_list,spring);
        var mul_label = this.player_tiles_panels[panel_idx].getChildByName("mul_label");

        mul_label.setString(multiple_list[0]);
        if(curGameRoom.dealerIdx==roundPlayerInfo.idx){
           mul_label.setString(multiple_list[0]*2);
        }
    },

    update_player_info: function (panel_idx, serverSitNum, curGameRoom) {
        if(!this.is_show) {return;}
        var cur_player_info_panel = this.player_tiles_panels[panel_idx];
        if(!cur_player_info_panel){
            return;
        }
        var playerInfo = curGameRoom.playerInfoList[serverSitNum];
        //cur_player_info_panel.getChildByName("owner_img").setVisible(playerInfo["is_creator"])
        cur_player_info_panel.getChildByName("name_label").setString(playerInfo["nickname"]);
        cur_player_info_panel.getChildByName("id_label").setString("ID:" + playerInfo["userId"].toString());
        cutil.loadPortraitTexture(playerInfo["head_icon"], playerInfo["sex"], function(img){
            var portrait_sprite  = new cc.Sprite(img);
            portrait_sprite.setName("portrait_sprite");
            portrait_sprite.setScale(78 / portrait_sprite.getContentSize().width);
            portrait_sprite.x = cur_player_info_panel.width * 0.0525;
            portrait_sprite.y = cur_player_info_panel.height * 0.5;
            cur_player_info_panel.addChild(portrait_sprite);
            portrait_sprite.setLocalZOrder(-1);
        });
    },


    _getCardImgPath: function (cardInt) {
        let rank = rules.get_rank(cardInt);
        let suit = rules.get_suit(cardInt);
        // 大小王
        if (rank > 20) {
            return "Poker/pic_poker_" + rank + '.png';
        } else {
            if (rank === rules.A) {
                rank = 1;
            }
            return "Poker/pic_poker_" + rules.POKER_COLOR_DICT[suit] + "" + rank + '.png';
        }
    },

});