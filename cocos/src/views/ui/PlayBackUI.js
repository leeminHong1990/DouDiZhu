"use strict";
var PlayBackUI = MultipleLayoutUI.extend({
    ctor: function () {
        this._super();
        this.resourceFilename = PlayBackUI.getResourceFile(cc.sys.localStorage.getItem(const_val.GAME_NAME+"GAME_ROOM_UI"));
    },

    initUI: function () {
        this.onLayoutChanged(false);
    },

    onLayoutChanged: function (fromCache) {
        this.finger_img = this.rootUINode.getChildByName("finger_img");
	    this.rate_label = this.rootUINode.getChildByName("room_info_panel").getChildByName("rate_label");
	    this.rate_label.ignoreContentAdaptWithSize(true);
        this.speed_label = this.rootUINode.getChildByName("room_info_panel").getChildByName("speed_label");
	    this.speed_label.ignoreContentAdaptWithSize(true);
    },

    updateRoomInfo: function (rateTxt, speed) {
        this.rate_label.setString('进度：' + rateTxt);
        this.speed_label.setString(speed + '倍速');
    },
});

PlayBackUI.ResourceFile2D = "res/ui/PlayBack2DUI.json";
PlayBackUI.ResourceFile3D = "res/ui/PlayBack3DUI.json";
PlayBackUI.getResourceFile = function (gameType) {
    if (gameType == const_val.GAME_ROOM_2D_UI) {
        return PlayBackUI.ResourceFile2D;
    } else if (gameType == const_val.GAME_ROOM_3D_UI) {
        return PlayBackUI.ResourceFile3D;
    } else {
        cc.warn("not support game type : ", gameType);
        return PlayBackUI.ResourceFile2D;
    }
};