var HelpUI = UIBase.extend({
    ctor: function () {
        this._super();
        this.resourceFilename = "res/ui/HelpUI.json";
        this.setLocalZOrder(const_val.MAX_LAYER_NUM);
    },

	show_by_info: function (info_dict) {
		this.info_dict = info_dict;
		this.show();
	},

    initUI: function () {
        var self = this;
        var help_panel = this.rootUINode.getChildByName("help_panel");

        var close_btn = help_panel.getChildByName("close_btn");

        var room_mode_btn = help_panel.getChildByName("room_mode_btn");
        var title_mj_btn = help_panel.getChildByName("title_mj_btn");
        room_mode_btn.setTouchEnabled(false);
        room_mode_btn.setBright(false);
        title_mj_btn.setTouchEnabled(true);
        title_mj_btn.setBright(true);

        var room_mode_panel = help_panel.getChildByName("room_mode_panel");
        var title_mj_panel = help_panel.getChildByName("title_mj_panel");
        room_mode_panel.setVisible(true);
        title_mj_panel.setVisible(false);

        if (this.info_dict) {
            this.change_select("round_panel", "round_chx" + String(parseInt(this.info_dict.game_round / 4) +1));
            if (this.info_dict.op_seconds > 0) {
                this.change_select("second_panel", "second_chx1");
            }
            this.change_select("game_mode_panel", "game_mode_chx" + String(this.info_dict.game_mode+1));

            var max_mul_num=1;
            switch (this.info_dict.max_boom_times){
                case 3:
                    max_mul_num=1;
                    break;
                case 4:
                    max_mul_num=2;
                    break;
                case 5:
                    max_mul_num=3;
                    break;
                case 9999:
                    max_mul_num=4;
                    break;
                default:
                    break;
            }
            cc.log(this.info_dict.max_boom_times);
            this.change_select("max_mul_panel", "max_mul_chx"+String(max_mul_num));

			if (this.info_dict.pay_mode === const_val.AA_PAY_MODE) {
				this.change_select("pay_panel", "pay_mode_chx2")
			} else {
				this.change_select("pay_panel", "pay_mode_chx1")
			}
			this.updatePayText(this.info_dict.room_type);
        } else {
            this.gamehall_show();
        }

		close_btn.hitTest = function (pt) {
			var size = this.getContentSize();
			var bb = cc.rect(-size.width, -size.height * 0.3, size.width * 3, size.height * 2);
			return cc.rectContainsPoint(bb, this.convertToNodeSpace(pt));
		};
        close_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                self.hide();
            }
        });

        room_mode_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                room_mode_btn.setTouchEnabled(false);
                room_mode_btn.setBright(false);
                title_mj_btn.setTouchEnabled(true);
                title_mj_btn.setBright(true);
                title_mj_panel.setVisible(false);
                room_mode_panel.setVisible(true);
            }
        });

        title_mj_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                title_mj_btn.setTouchEnabled(false);
                title_mj_btn.setBright(false);
                room_mode_btn.setTouchEnabled(true);
                room_mode_btn.setBright(true);
                room_mode_panel.setVisible(false);
                title_mj_panel.setVisible(true);
            }
        });
    },

    change_select: function (parentName, chxName) {
        cc.log(parentName, chxName)
        var room_mode_panel = this.rootUINode.getChildByName("help_panel").getChildByName("room_mode_panel");
        var chx = room_mode_panel.getChildByName(parentName).getChildByName(chxName);
        chx.setBright(true);
    },

    gamehall_show: function () {
        var help_panel = this.rootUINode.getChildByName("help_panel");
        var room_mode_btn = help_panel.getChildByName("room_mode_btn");
        var title_mj_btn = help_panel.getChildByName("title_mj_btn");
        var line_img = help_panel.getChildByName("line_img");
        room_mode_btn.setVisible(false);
        line_img.setVisible(false);
        title_mj_btn.setTouchEnabled(false);
        title_mj_btn.setBright(false);
        title_mj_btn.setPositionY(title_mj_btn.getPositionY() + 100);

        var room_mode_panel = help_panel.getChildByName("room_mode_panel");
        var title_mj_panel = help_panel.getChildByName("title_mj_panel");
        room_mode_panel.setVisible(false);
        title_mj_panel.setVisible(true);
    },

	updatePayText: function (r_type) {
		var help_panel = this.rootUINode.getChildByName("help_panel");
		var room_mode_panel = help_panel.getChildByName("room_mode_panel");
		var pay_panel = room_mode_panel.getChildByName("pay_panel");
		var label_1 = pay_panel.getChildByName("pay_mode_label_1");
		if (r_type === const_val.CLUB_ROOM) {
			label_1.setString("楼主支付");
		} else {
			label_1.setString("房主支付");
		}
	}
});