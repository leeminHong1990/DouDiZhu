"use strict";
/*-----------------------------------------------------------------------------------------
 interface
 -----------------------------------------------------------------------------------------*/
var impGameRules = impGameOperation.extend({
	__init__: function () {
		this._super();
		KBEngine.DEBUG_MSG("Create impGameRules");
	},

	getWaitOpDict: function (wait_aid_list, data_list, serverSitNum) {
		serverSitNum = serverSitNum || this.serverSitNum;
		var op_dict = {};
		for (var i = 0; i < wait_aid_list.length; i++) {
			op_dict[wait_aid_list[i]] = data_list[i];
		}
		if (Object.keys(op_dict).length > 0) {
			op_dict[const_val.OP_PASS] = []
		}
		cc.log("getWaitOpDict==>", wait_aid_list, data_list, op_dict, serverSitNum);
		return op_dict
	},

	compareCards: function (src, dest, converted, ignoreGreater) {
		if (!converted) {
			src = rules.convert(src, false, false);
			dest = rules.convert(dest, false, false);
		}

		function compare(infoA, infoB) {
			if (rules.SEQS.indexOf(infoA[1]) >= 0) {
				if (infoB[2] > infoA[2] && infoB[3] - infoB[2] === infoA[3] - infoA[2]) {
					return infoB[2] - infoA[2];
				}
			} else {
				return rules.compare_rank(infoB[2], infoA[2]);
			}
			return -1;
		}

		let srcInfo = rules.test_with_rule(src, true, true, true);
		if (!srcInfo[0]) {
			return -1;
		}
		let srcType = srcInfo[1];
		let func = rules.COMPARE_TYPE_FUNC_MAP[srcType];
		let destInfo = func(dest);
		if (destInfo[0]) {
			return compare(srcInfo, destInfo);
		}
		if (ignoreGreater) {
			return -1;
		}
		let types = rules.getGreaterThan(srcType);
		if (types !== null) {
			for (var i = 0; i < types.length; i++) {
				let info = rules.COMPARE_TYPE_FUNC_MAP[types[i]](dest);
				if (info[0]) {
					return true;
				}
			}
		}
		return -1;
	},

	canDiscard: function (cards, serverSitNum) {
		if (!this.curGameRoom) {
			return false;
		}
		serverSitNum = serverSitNum || this.serverSitNum;
		if (this.curGameRoom.curPlayerSitNum !== serverSitNum) {
			return false;
		}

		let lastCards = this.curGameRoom.getLastDiscard(serverSitNum);
		if (lastCards) {
			return this.compareCards(lastCards, cards) > 0;
		} else {
			// 可以出任意牌
			return rules.test_with_rule(cards, false, false);
		}
	},

	/**
	 *
	 * @param type
	 * @param src 需要比这个牌大
	 * @param ignoreTail 忽略类似3带1 中的1
	 * @param targetCards 从目标中选择
	 * @param ignoreGreater 是否不比较优先级高的牌
	 * @returns {*}
	 */
	getGreaterThanCards: function (type, src, ignoreTail, ignoreGreater, targetCards) {
		ignoreGreater = ignoreGreater || false;
		src = src || this.curGameRoom.getLastDiscard(this.serverSitNum);
		if (src) {
			src = rules.convert(src, false, false);
		}
		targetCards = targetCards || rules.convert(this.curGameRoom.handTilesList[this.serverSitNum], false, false);
		let iter = rules.ITER_TYPE_FUNC_MAP[type];
		let iterData = iter(targetCards, true, true, ignoreTail && rules.IGNORE_TAIL_FUNC.indexOf(iter) >= 0);
		if (!src) {
			return iterData;
		}

		let srcInfo = rules.test_with_rule(src, true, true, true);
		if (!srcInfo[0]) {
			cc.warn("data error", src);
			return rules.emptyIter(targetCards, "data_error");
		}

		let srcPriority = rules.getPriority(srcInfo[1]);
		let destPriority = rules.getPriority(type);
		if (srcInfo[0]) {
			// Note:  排除不满足条件选项
			if (srcPriority > destPriority || (srcPriority === destPriority && srcInfo[1] !== type)) {
				return rules.emptyIter(targetCards, "priority_ignore_" + type + "_" + srcInfo[1]);
			}
		}

		var self = this;
		let wrapper = {};
		wrapper._sourceType = type;
		wrapper._source = iterData;
		wrapper.next = function () {
			if (!this.nextData) {
				if (this.hasNext()) {
					let data = this.nextData;
					this.nextData = null;
					return data;
				}
				return null;
			}
			let tmp = this.nextData;
			this.nextData = null;
			return tmp;
		};
		wrapper.hasNext = function () {
			if (this.nextData) {
				return true;
			}
			while (iterData.hasNext()) {
				var data = iterData.next();
				if (self.compareCards(src, data, true, ignoreGreater) > 0) {
					this.nextData = data;
					return true;
				}
			}
			return false;
		};
		return wrapper;
	},

	hasGreaterThan: function () {
		let src = this.curGameRoom.getLastDiscard(this.serverSitNum);
		if (!src) {
			return this.curGameRoom.handTilesList[this.serverSitNum].length > 0;
		}
		src = rules.convert(src, false, false);
		let srcInfo = rules.test_with_rule(src, true, true, true);
		if (srcInfo[0]) {
			let types = rules.getGreaterThan(srcInfo[1]);
			if (types === null) {
				types = [srcInfo[1]];
			} else {
				types.splice(0, 0, srcInfo[1]);
			}
			for (var i = 0; i < types.length; i++) {
				let iter = this.getGreaterThanCards(types[i], src, true);
				if (iter.hasNext()) {
					return true;
				}
			}
		}
		return false;
	},

	getBestTip: function (selectCards) {
		selectCards = rules.convert(selectCards, false, false);
		let lastCards = this.curGameRoom.getLastDiscard(this.serverSitNum);
		let lastType = null;
		if (lastCards) {
			let lastInfo = rules.test_with_rule(lastCards, false, false, true);
			if (lastInfo) {
				lastType = lastInfo[1];
			}
		}
		let best = null;
		for (var i = 0; i < rules.ALL_TYPES.length; i++) {
			let iter = this.getGreaterThanCards(rules.ALL_TYPES[i], lastCards, true, false, selectCards);
			if (lastType === rules.ALL_TYPES[i]) {
				if (iter.hasNext()) {
					return iter.next();
				}
			} else {
				let tmp = iter.next();
				if (tmp != null) {
					if (best === null || tmp.length > best.length) {
						best = tmp;
					}
				}
			}
		}
		return best;
	}

});
// Note: 为了播放开局动画时使用
impGameRules.waitOpDict = function (wait_aid_list, data_list, serverSitNum) {
	var op_dict = {};
	for (var i = 0; i < wait_aid_list.length; i++) {
		op_dict[wait_aid_list[i]] = data_list[i];
	}
	if (Object.keys(op_dict).length > 0) {
		op_dict[const_val.OP_PASS] = []
	}
	cc.log("waitOpDict==>", wait_aid_list, data_list, op_dict, serverSitNum);
	return op_dict
};
