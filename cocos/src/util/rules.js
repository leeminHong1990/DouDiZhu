"use strict";
var rules = function () {
};
rules.POKER_NUM_STRING_DICT = {
	2: '2',
	3: '3',
	4: '4',
	5: '5',
	6: '6',
	7: '7',
	8: '8',
	9: '9',
	10: '10',
	11: 'J',
	12: 'Q',
	13: 'K',
	14: 'A',
	20: 'F',
	21: 'L',
	22: 'B',
};
rules.A = 14;
rules.FLOWER = 20;
rules.LITTLE_JOKER = 21;
rules.BIG_JOKER = 22;

rules.POKER_COLOR_DICT = {
	1: "a",
	2: "c",
	8: "b",
	4: "d",
};

rules.TYPE_SINGLE = 0;
rules.TYPE_PAIR_JOKER = 1;
rules.TYPE_PAIR2 = 2;
rules.TYPE_PAIR3 = 3;
rules.TYPE_PAIR3_1 = 4;
rules.TYPE_PAIR3_2 = 5;
rules.TYPE_PAIR4 = 6;
// rules.TYPE_PAIR4_2 = 7;
rules.TYPE_SEQ_PAIR2 = 8;
rules.TYPE_SEQ_PAIR3 = 9;
rules.TYPE_SEQ_PAIR3_1 = 10;
rules.TYPE_SEQ_PAIR3_2 = 11;
rules.TYPE_SEQ = 12;
rules.TYPE_PAIR4_2_1 = 13;
rules.TYPE_PAIR4_2_2 = 14;
rules.TYPE_FLOWER = 15;


rules.ALL_TYPES = [
	rules.TYPE_SINGLE, rules.TYPE_PAIR2, rules.TYPE_PAIR3,
	rules.TYPE_PAIR3_1, rules.TYPE_PAIR3_2,
	rules.TYPE_SEQ_PAIR2, rules.TYPE_SEQ_PAIR3, rules.TYPE_SEQ_PAIR3_1, rules.TYPE_SEQ_PAIR3_2, rules.TYPE_SEQ,
	rules.TYPE_PAIR4, rules.TYPE_PAIR4_2_1, rules.TYPE_PAIR4_2_2,
	rules.TYPE_PAIR_JOKER
];

rules.get_suit = function (value) {
	return (value & 0x0000ff00) >>> 8;
};

rules.get_rank = function (value) {
	return value & 0x000000ff;
};

rules.to_card = function (suit, rank) {
	return (suit << 8) | rank;
};

rules.poker_compare = function (a, b, suit) {
	suit = suit === undefined ? true : suit;
	let color1 = rules.get_suit(a);
	let num1 = rules.get_rank(a);
	let color2 = rules.get_suit(b);
	let num2 = rules.get_rank(b);
	if (num1 === num2 && suit) {
		return color1 - color2;
	}
	return rules.compare_rank(num1, num2);
};

rules.poker_compare2 = function (a, b, suit) {
	suit = suit === undefined ? true : suit;
	let color1 = rules.get_suit(a);
	let num1 = rules.get_rank(a);
	let color2 = rules.get_suit(b);
	let num2 = rules.get_rank(b);
	if (num1 === num2 && suit) {
		return color1 - color2;
	}
	return rules.compare_rank(num2, num1);
};

rules.compare_rank = function (a, b) {
	if (a === 2) {
		a = a + 16;
	}
	if (b === 2) {
		b = b + 16;
	}
	return a - b;
};

rules.extract_pair = function (ints, count) {
	//提取数组中的对子
	let groups = collections.groupBy(ints);
	let arr = [];
	for (var k in groups) {
		if (groups[k] >= count) {
			arr.push(Number(k))
		}
	}
	return arr
};

rules.convert = function (cardsInt, sorted, converted) {
	sorted = sorted === undefined ? true : sorted;
	converted = converted === undefined ? true : converted;
	if (!converted) {
		cardsInt = collections.map(cardsInt, rules.get_rank)
	}
	if (!sorted) {
		cardsInt = cardsInt.sort(rules.poker_compare)
	}
	return cardsInt;
};

rules.is_single = function (cardsInt, sorted, converted) {
	return [cardsInt.length === 1, rules.TYPE_SINGLE, cardsInt[0]];
};

rules.is_flower = function (cardsInt, sorted, converted) {
	return [cardsInt.length === 1 && cardsInt[0] === rules.FLOWER, rules.TYPE_FLOWER, cardsInt[0]];
};

rules.is_pair_joker = function (cardsInt, sorted, converted) {
	return [cardsInt.length === 2 && cardsInt[0] + cardsInt[1] === rules.LITTLE_JOKER + rules.BIG_JOKER, rules.TYPE_PAIR_JOKER];
};

rules.is_pair2 = function (cardsInt, sorted, converted) {
	cardsInt = rules.convert(cardsInt, true, converted);
	return [cardsInt.length === 2 ? cardsInt[1] === cardsInt[0] : false, rules.TYPE_PAIR2, cardsInt[0]];
};
rules.is_pair3 = function (cardsInt, sorted, converted) {
	cardsInt = rules.convert(cardsInt, sorted, converted);
	return [cardsInt.length === 3 ? collections.sum(cardsInt) === cardsInt[0] * 3 : false, rules.TYPE_PAIR3, cardsInt[0]];
};

rules.is_pair3_1 = function (cardsInt, sorted, converted) {
	if (cardsInt.length !== 4) {
		return [false, rules.TYPE_PAIR3_1, -1]
	}
	cardsInt = rules.convert(cardsInt, sorted, converted);
	let sum = collections.sum(cardsInt);
	let c0 = cardsInt[0];
	let c2 = cardsInt[3];
	let f1 = c2 * 3 + c0;
	let f2 = c0 * 3 + c2;
	return [f1 - f2 === (c2 - c0) * 2 && (sum === f2 || sum === f1) && c0 !== c2, rules.TYPE_PAIR3_1, sum === f2 ? c0 : c2];
};


rules.is_pair3_2 = function (cardsInt, sorted, converted) {
	if (cardsInt.length !== 5) {
		return [false, rules.TYPE_PAIR3_2, -1]
	}
	let has3 = false;
	let has2 = false;
	let primary = -1;
	let groups = collections.groupBy(cardsInt);
	for (var key in groups) {
		if (groups[key] === 3) {
			has3 = true;
			primary = Number(key);
		} else if (groups[key] === 2) {
			has2 = true
		}
		else {
			return [false, rules.TYPE_PAIR3_2, -1]
		}
	}
	return [has2 && has3, rules.TYPE_PAIR3_2, primary]
};

rules.is_pair4 = function (cardsInt, sorted, converted) {
	cardsInt = rules.convert(cardsInt, sorted, converted);
	return [cardsInt.length === 4 ? collections.sum(cardsInt) === cardsInt[0] * 4 : false, rules.TYPE_PAIR4, cardsInt[0]];
};

rules.is_pair4_X = function (cardsInt, type, tailCount, sorted, converted) {
	if (cardsInt.length !== 4 + tailCount * 2) {
		return [false, type, -1]
	}
	cardsInt = rules.convert(cardsInt, sorted, converted);
	let groups = collections.groupBy(cardsInt);
	let has4 = false;
	let count1 = 0;
	let count2 = 0;
	let primary = null;
	for (var key in groups) {
		let count = groups[key];
		if (count === 4) {
			has4 = true;
			primary = Number(key);
		} else {
			if (count === 1) {
				count1++;
			} else if (count === 2) {
				count2++;
			} else {
				return [false, type, -1]
			}
		}
	}
	let has2 = false;
	if (tailCount === 1) {
		has2 = (count1 === 2 && count2 === 0) || (count1 === 0 && count2 === 1);
	} else {
		has2 = count1 === 0 && count2 === 2;
	}
	return [has2 && has4, type, primary];
};

rules.is_pair4_4 = function (cardsInt, sorted, converted) {
	if (cardsInt.length !== 8) {
		return [false, rules.TYPE_PAIR4_2_2, -1]
	}
	cardsInt = rules.convert(cardsInt, sorted, converted);
	let groups = collections.groupBy(cardsInt);
	let primary = 0;
	let count = 0;
	for (var key in groups) {
		let count = groups[key];
		if (count === 4) {
			count++;
			primary = Math.max(primary, Number(key));
		} else {
			return [false, rules.TYPE_PAIR4_2_2, -1]
		}
	}
	return [count === 2, rules.TYPE_PAIR4_2_2, primary]
};

rules.is_pair4_2_1 = function (cardsInt, sorted, converted) {
	return rules.is_pair4_X(cardsInt, rules.TYPE_PAIR4_2_1, 1, sorted, converted);
};

rules.is_pair4_2_2 = function (cardsInt, sorted, converted) {
	cardsInt = rules.convert(cardsInt, sorted, converted);
	let pair422 = rules.is_pair4_X(cardsInt, rules.TYPE_PAIR4_2_2, 2, true, true);
	if(pair422[0]){
		return pair422;
	}
	return rules.is_pair4_4(cardsInt, true, true);
};

rules.is_seq_pair2 = function (cardsInt, sorted, converted) {
	let l = cardsInt.length;
	if (l % 2 !== 0 || l < 6) {
		return [false, rules.TYPE_SEQ_PAIR2, -1, -1];
	}
	cardsInt = rules.convert(cardsInt, sorted, converted);

	return [cardsInt[0] !== 2 && cardsInt[l - 1] - cardsInt[0] === l / 2 - 1
	&& (cardsInt[0] + cardsInt[l - 1]) * (l / 2) === collections.sum(cardsInt)
		, rules.TYPE_SEQ_PAIR2, cardsInt[0], cardsInt[l - 1]]
};

rules.is_seq_pair3 = function (cardsInt, sorted, converted) {
	let l = cardsInt.length;
	if (l % 3 !== 0 || l < 6) {
		return [false, rules.TYPE_SEQ_PAIR3, -1, -1];
	}
	cardsInt = rules.convert(cardsInt, sorted, converted);
	return [cardsInt[0] !== 2 && cardsInt[l - 1] - cardsInt[0] === l / 3 - 1
	&& (cardsInt[0] + cardsInt[l - 1]) / 2 * l === collections.sum(cardsInt)
		, rules.TYPE_SEQ_PAIR3, cardsInt[0], cardsInt[l - 1]]
};

rules.is_seq_pair3_with_any = function (cardsInt, tailCount, type) {
	let l = cardsInt.length;
	if (l % (3 + tailCount) !== 0 && l < (3 + tailCount) * 2) {
		return [false, type, -1, -1];
	}
	let pair3Arr = rules.extract_pair(cardsInt, 3);
	let pair_len = pair3Arr.length;
	if (pair_len < 2) {
		return [false, type, -1, -1];
	}
	let c0 = pair3Arr[0];
	let c1 = pair3Arr[pair_len - 1];
	if (c0 > 2 && c1 - c0 === pair_len - 1 && collections.sum(pair3Arr) * 2 === (c0 + c1) * pair_len) {
		let other_count = l - pair_len * 3;
		if (other_count !== pair_len * tailCount) {
			return [false, type, -1, -1];
		}
		let others = [];
		for (var i = 0; i < cardsInt.length; i++) {
			if (pair3Arr.indexOf(cardsInt[i]) < 0) {
				others.push(cardsInt[i]);
			}
		}
		if (rules.extract_pair(others, tailCount).length === pair_len) {
			return [true, type, c0, c1];
		}
	}
	return [false, type, -1, -1];
};
rules.is_seq_pair3_1 = function (cardsInt, sorted, converted) {
	let l = cardsInt.length;
	if (l % 4 !== 0 && l < 8) {
		return [false, rules.TYPE_SEQ_PAIR3_1, -1, -1];
	}
	cardsInt = rules.convert(cardsInt, sorted, converted);
	return rules.is_seq_pair3_with_any(cardsInt, 1, rules.TYPE_SEQ_PAIR3_1);
};
rules.is_seq_pair3_2 = function (cardsInt, sorted, converted) {
	let l = cardsInt.length;
	if (l % 5 !== 0 && l < 10) {
		return [false, rules.TYPE_SEQ_PAIR3_2, -1, -1];
	}
	cardsInt = rules.convert(cardsInt, sorted, converted);
	return rules.is_seq_pair3_with_any(cardsInt, 2, rules.TYPE_SEQ_PAIR3_2);
};

rules.is_seq = function (cardsInt, sorted, converted) {
	let len = cardsInt.length;
	if (len < 5) {
		return [false, rules.TYPE_SEQ, -1, -1];
	}
	cardsInt = rules.convert(cardsInt, sorted, converted);
	let c0 = cardsInt[0];
	let c1 = cardsInt[len - 1];
	return [c0 > 2 && c1 - c0 === len - 1 && collections.sum(cardsInt) * 2 === (c0 + c1) * len, rules.TYPE_SEQ, c0, c1];
};

rules.TEST_RULES = [
	rules.is_single, rules.is_flower, rules.is_pair_joker, rules.is_pair2, rules.is_pair3, rules.is_pair4,
	rules.is_pair3_1, rules.is_pair3_2,
	rules.is_pair4_2_1, rules.is_pair4_2_2,
	rules.is_seq, rules.is_seq_pair2, rules.is_seq_pair3, rules.is_seq_pair3_1, rules.is_seq_pair3_2,
];

rules.test_with_rule = function (cardsInt, sorted, converted, returnInfo) {
	cardsInt = rules.convert(cardsInt, sorted, converted);
	for (let i = 0; i < rules.TEST_RULES.length; i++) {
		let matchFunc = rules.TEST_RULES[i];
		let result = matchFunc(cardsInt, sorted, converted);
		if (returnInfo && result[0]) {
			return result;
		} else if (result[0]) {
			return true;
		}
	}
	if (returnInfo) {
		return [false];
	}
	return false;
};

rules.iterSortCompare = function (a, b) {
	if (a === 2) {
		a = a + 16
	}
	if (b === 2) {
		b = b + 16;
	}
	return a - b;
};

rules.emptyIter = function (cardsInt, type) {
	var iter = {};
	iter._sourceType = type;
	iter.source = cardsInt;
	iter.hasNext = function () {
		return false;
	};
	iter.next = function () {
		return null;
	};
	return iter;
};

// 对数据分类后排序整合 [2,2,3,3,4,] ==> [4,3,2]
// start: 1 ,2,3,4 拍再最前面的
rules.tidyData = function (cardsInt, start) {
	let groups = collections.groupBy(cardsInt);
	let tmp = [[], [], [], []];
	for (var key  in  groups) {
		let count = groups[key];
		if (count >= start) {
			let arr = tmp[count - start];
			if (!arr) {
				tmp[count - start] = [];
			}
			arr.push(Number(key))
		}
	}
	let result = [];
	for (var i = 0; i < tmp.length; i++) {
		if (tmp[i] && tmp [i].length > 0) {
			result = result.concat(tmp[i].sort(rules.iterSortCompare));
		}
	}
	return result;
};

rules.single = function (cardsInt, sorted, converted) {
	cardsInt = rules.convert(cardsInt, sorted, converted);

	let arr = rules.tidyData(cardsInt, 1);

	let iter = {};
	iter.source = cardsInt;
	iter._tmp = arr;
	cardsInt = arr;
	iter.next = function () {
		if (this.hasNext()) {
			return [cardsInt[this.index++]];
		} else {
			return null;
		}
	};
	iter.hasNext = function () {
		return this.index < cardsInt.length;
	};
	iter.index = 0;
	return iter;
};

rules.flower = function (cardsInt, sorted, converted) {
	let iter = {};
	iter.source = cardsInt;
	iter.next = function () {
		if (this.flag) {
			return null;
		}
		if (this.hasNext()) {
			this.flag = true;
			return [rules.FLOWER];
		}
		return null;
	};
	iter.hasNext = function () {
		return !this.flag && cardsInt.indexOf(rules.FLOWER) >= 0;
	};
	iter.flag = false;
	return iter;
};

rules.pair_joker = function (cardsInt) {
	let iter = {};
	iter.source = cardsInt;
	iter.next = function () {
		if (this.flag) {
			return null;
		}
		if (this.hasNext()) {
			this.flag = true;
			return [rules.LITTLE_JOKER, rules.BIG_JOKER];
		}
		return null;
	};
	iter.hasNext = function () {
		return !this.flag && cardsInt.indexOf(rules.BIG_JOKER) >= 0 && cardsInt.indexOf(rules.LITTLE_JOKER) >= 0;
	};
	iter.flag = false;
	return iter;
};

rules.pair = function (cardsInt, count, sorted, converted) {
	cardsInt = rules.convert(cardsInt, sorted, converted);

	let pairArr = rules.tidyData(cardsInt, count);
	if (pairArr.length === 0) {
		return rules.emptyIter(cardsInt, "pair_" + count);
	}
	let iter = {};
	iter.source = cardsInt;
	iter.next = function () {
		if (this.hasNext()) {
			return new Array(count).fill(pairArr[this.index++]);
		}
		return null;
	};
	iter.hasNext = function () {
		if (this.index < pairArr.length) {
			for (var i = this.index; i < pairArr.length; i++) {
				this.index = i;
				return true;
			}
		}
		this.index = -1;
		return false;
	};
	iter.index = 0;
	return iter;
};
rules.pair2 = function (cardsInt, sorted, converted) {
	return rules.pair(cardsInt, 2, sorted, converted);
};

rules.pair3 = function (cardsInt, sorted, converted) {
	return rules.pair(cardsInt, 3, sorted, converted);
};

rules.pair4 = function (cardsInt, sorted, converted) {
	return rules.pair(cardsInt, 4, sorted, converted);
};

rules.pairAndTail = function (cardsInt, pairCount, tailCount, ignoreTail, sorted, converted) {
	if (cardsInt.length < pairCount + tailCount) {
		return rules.emptyIter(cardsInt, "pair" + pairCount + "_" + tailCount)
	}
	let iter = {};
	iter.source = cardsInt;
	cardsInt = rules.convert(cardsInt, sorted, converted);
	let pairArr = rules.extract_pair(cardsInt, pairCount).sort(rules.iterSortCompare);
	let tailArr = rules.tidyData(cardsInt, tailCount);

	iter.pairIndex = 0;
	iter.tailIndex = 0;
	iter.consume = true;
	iter.hasNext = function () {
		// 上一次 hasNext 还未消费掉
		if (!this.consume) {
			return true;
		}
		if (pairArr.length === 0 || tailArr.length === 0 || tailArr.length === 1) {
			return false;
		}
		if (this.pairIndex < pairArr.length) {
			let head = null;
			let tail = null;
			if (ignoreTail) {
				head = pairArr[this.pairIndex++];
				tail = tailArr[this.tailIndex];
			} else {
				head = pairArr[this.pairIndex];
				tail = tailArr[this.tailIndex++];
			}
			while (head === tail) {
				if (ignoreTail) {
					this.tailIndex++;
				}
				if (this.tailIndex === tailArr.length) {
					if (++this.pairIndex < pairArr.length) {
						this.tailIndex = 0;
					} else {
						iter.consume = true;
						return false;
					}
				}
				head = pairArr[this.pairIndex];
				if (ignoreTail) {
					tail = tailArr[this.tailIndex];
				} else {
					tail = tailArr[this.tailIndex++];
				}
			}
			if (this.tailIndex === tailArr.length) {
				if (++this.pairIndex < pairArr.length) {
					this.tailIndex = 0;
				}
			}
			this.head = head;
			this.tail = tail;
			iter.consume = false;
			if (ignoreTail) {
				this.tailIndex = 0;
			}
			return true;
		}

		return false;
	};
	iter.next = function () {
		if (this.hasNext()) {
			this.consume = true;
			let data = new Array(pairCount + tailCount);
			data.fill(this.head, 0, pairCount);
			data.fill(this.tail, pairCount);
			this.head = null;
			this.tail = null;
			return data;
		}
		return null;
	};
	return iter;
};

rules.pair3_1 = function (cardsInt, sorted, converted, ignoreTail) {
	return rules.pairAndTail(cardsInt, 3, 1, ignoreTail, sorted, converted);
};

rules.pair3_2 = function (cardsInt, sorted, converted, ignoreTail) {
	return rules.pairAndTail(cardsInt, 3, 2, ignoreTail, sorted, converted);
};

rules.pair4_2_x = function (cardsInt, tailCount, ignoreTail, type) {
	if (cardsInt.length < 4 + 2 * tailCount) {
		return rules.emptyIter(cardsInt, "pair4_2_" + tailCount);
	}
	let pairArr = rules.extract_pair(cardsInt, 4);
	let tailArr = rules.extract_pair(cardsInt, tailCount);
	if (tailArr.length < 2 || pairArr.length === 0) {
		return rules.emptyIter(cardsInt, "pair4_2_" + tailCount);
	}
	pairArr = pairArr.sort(rules.iterSortCompare);

	let iter = {};
	iter.source = cardsInt;
	iter._sourceType = type;
	iter.pairIndex = 0;
	iter.tailIndex = 0;
	iter.tailCount = 1;
	iter.tailComb = [];
	iter.consume = true;

	collections.combinations(tailArr, 2, function (target) {
		// source: [ [1,2],[2,3]]  target: [3,2]
		// [3 , 2] in  [[1,2] , [2,3]]
		// [3 , 3] not in  [[1,2] , [2,3]]
		let t0 = target[0];
		let t1 = target[1];
		// Note: 不能出现2222，3333这个情况 再这里过滤掉了
		if (tailCount > 1) {
			if (t0 === t1) {
				return;
			}
		}
		for (var i = 0; i < iter.tailComb.length; i++) {
			let src = iter.tailComb[i];
			if ((src[0] === t0 && src[1] === t1) || (src[0] === t1 && src[1] === t0)) {
				return;
			}
		}
		iter.tailComb.push(target);
	});
	iter.hasNext = function () {
		if (!this.consume) {
			return true;
		}
		if (pairArr.length === 0 || this.tailComb.length === 0) {
			return false;
		}
		if (this.pairIndex >= pairArr.length) {
			return false;
		}
		let head = pairArr[this.pairIndex];
		let tail = this.tailComb[this.tailIndex++];
		while (tail.indexOf(head) >= 0) {
			if (this.tailIndex === this.tailComb.length) {
				if (++this.pairIndex < pairArr.length) {
					this.tailIndex = 0;
				} else {
					this.consume = true;
					return false;
				}
			}
			head = pairArr[this.pairIndex];
			tail = this.tailComb[this.tailIndex++];
		}
		if (this.tailIndex === this.tailComb.length) {
			if (++this.pairIndex < pairArr.length) {
				this.tailIndex = 0;
			}
		}
		this.consume = false;
		this.head = head;
		this.tail = tail;
		return true;
	};
	iter.next = function () {
		if (this.hasNext()) {
			this.consume = true;
			let data = new Array(4 + 2 * tailCount);
			data.fill(this.head, 0, 4);
			data.fill(this.tail[0], 4, 4 + tailCount);
			data.fill(this.tail[1], 4 + tailCount, 4 + tailCount * 2);
			return data;
		}
		return null;

	};
	return iter;
};

rules.pair4_4 = function (cardsInt, sorted, converted) {
	if (cardsInt.length < 8) {
		return rules.emptyIter(cardsInt, "pair4_4");
	}
	cardsInt = rules.convert(cardsInt, sorted, converted);
	let pairArr = rules.extract_pair(cardsInt, 4);
	if (pairArr < 2) {
		return rules.emptyIter(cardsInt, "pair4_4");
	}
	var iter = {};
	iter.source = cardsInt;
	iter.index = 0;
	iter.comb = [];
	collections.combinations(pairArr, 2, function (target) {
		for (var i = 0; i < iter.comb.length; i++) {
			let src = iter.comb[i];
			let t0 = target[0];
			let t1 = target[1];
			if ((src[0] === t0 && src[1] === t1) || (src[0] === t1 && src[1] === t0)) {
				return;
			}
		}
		iter.comb.push(target);
	});
	iter.hasNext = function () {
		return this.index < this.comb.length;
	};
	iter.next = function () {
		let arr = this.comb[this.index++];
		if (arr) {
			let data = new Array(8);
			data.fill(arr[0], 0, 4);
			data.fill(arr[1], 4);
			return data;
		}
		return null;
	};
	return iter;
};

rules.pair4_2_1 = function (cardsInt, sorted, converted, ignoreTail) {
	cardsInt = rules.convert(cardsInt, sorted, converted);
	return rules.pair4_2_x(cardsInt, 1, ignoreTail, rules.TYPE_PAIR4_2_1)
};
rules.pair4_2_2 = function (cardsInt, sorted, converted, ignoreTail) {
	cardsInt = rules.convert(cardsInt, sorted, converted);

	var iter = {};
	iter.source = cardsInt;
	iter.arr = [rules.pair4_2_x(cardsInt, 2, ignoreTail, rules.TYPE_PAIR4_2_2), rules.pair4_4(cardsInt, true, true)];
	iter.index = 0;
	iter.hasNext = function () {
		var cur = this.arr[this.index];
		if (!cur) {
			return false;
		}
		while (!cur || !cur.hasNext()) {
			if (!cur) {
				return false;
			}
			cur = this.arr[++this.index];
		}
		return true;
	};
	iter.next = function () {
		return this.arr[this.index].next();
	};
	return iter;
};

rules.seq_pair = function (cardsInt, pairCount, seqCount, sorted, converted) {
	if (cardsInt.length < pairCount * seqCount) {
		return rules.emptyIter(cardsInt, "seq_pair_" + pairCount)
	}
	let iter = {};
	iter.source = cardsInt;
	cardsInt = rules.convert(cardsInt, sorted, converted);
	let pairArr = null;
	if (pairCount === 1) {
		pairArr = collections.unique(cardsInt);
	} else {
		pairArr = rules.extract_pair(cardsInt, pairCount);
	}
	iter.seqCount = seqCount;
	iter.combArr = null;
	iter.combIndex = 0;
	iter.hasNext = function () {
		if (this.seqCount > pairArr.length || pairArr.length === 0) {
			return false;
		}
		if (!this.combArr) {
			this.combArr = [];
			while (this.combArr.length === 0 && this.seqCount <= pairArr.length) {
				collections.combinations(pairArr, this.seqCount, function (arr) {
					arr = arr.sort(collections.compare);
					if (arr[0] > 2 && 2 * collections.sum(arr) === (arr[0] + arr[iter.seqCount - 1]) * iter.seqCount && arr[iter.seqCount - 1] - arr[0] === iter.seqCount - 1) {
						iter.combArr.push(arr);
					}
				});
				if (this.combArr.length === 0) {
					this.seqCount++;
				}
			}
		}
		return this.combArr.length !== 0;
	};

	iter.next = function () {
		if (this.hasNext()) {
			let arr = this.combArr[this.combIndex++];
			if (this.combIndex >= this.combArr.length) {
				this.seqCount++;
				this.combArr = null;
				this.combIndex = 0;
			}
			let data = new Array(arr.length * pairCount);
			for (var i = 0; i < arr.length; i++) {
				data.fill(arr[i], i * pairCount, i * pairCount + pairCount)
			}
			return data;
		}
		return null;
	};
	return iter;
};

rules.seq_pair2 = function (cardsInt, sorted, converted) {
	return rules.seq_pair(cardsInt, 2, 3, sorted, converted);
};

rules.seq_pair3 = function (cardsInt, sorted, converted) {
	return rules.seq_pair(cardsInt, 3, 2, sorted, converted);
};

rules.seq = function (cardsInt, sorted, converted) {
	return rules.seq_pair(cardsInt, 1, 5, sorted, converted);
};

rules.seq_pair3_x = function (cardsInt, seqCount, tailCount, ignoreTail) {
	if (cardsInt.length < (seqCount * 3 + tailCount * seqCount)) {
		return rules.emptyIter(cardsInt, "seq_pair3_" + tailCount + "_seq_" + seqCount)
	}
	let pairArr = rules.extract_pair(cardsInt, 3);
	if (pairArr.length < seqCount) {
		return rules.emptyIter(cardsInt, "seq_pair3_" + tailCount + "_seq_" + seqCount)
	}
	var iter = {};
	iter.source = cardsInt;
	let tailArr = rules.extract_pair(cardsInt, tailCount);
	if (tailCount === 1) {
		tailArr = tailArr.concat(rules.extract_pair(cardsInt, 2));
	}
	iter.tailComb = [];
	collections.combinations(tailArr, seqCount, function (target) {
		if (tailCount > 1) {
			if (collections.all(target, function (a) {
				return target[0] === a;
			})) {
				return;
			}
		}
		target = target.sort(collections.compare);

		for (var i = 0; i < iter.tailComb.length; i++) {
			let src = iter.tailComb[i];
			let flag = true;
			for (var j = 0; j < target.length; j++) {
				if (src[j] !== target[j]) {
					flag = false;
					break;
				}
			}
			if (flag) {
				return;
			}
		}
		iter.tailComb.push(target);
	});
	iter.pairComb = [];
	collections.combinations(pairArr, seqCount, function (target) {
		if (!(target[0] > 2 && 2 * collections.sum(target) === (target[0] + target[seqCount - 1]) * seqCount && target[seqCount - 1] - target[0] === seqCount - 1)) {
			return;
		}
		iter.pairComb.push(target);
	});

	iter.pairIndex = 0;
	iter.tailIndex = 0;
	iter.consume = true;

	iter.hasNext = function () {
		// 上一次 hasNext 还未消费掉
		if (!this.consume) {
			return true;
		}
		if (this.pairComb.length === 0 || this.tailComb.length < seqCount * 2) {
			return false;
		}
		var head = null;
		var tail = null;
		var find = false;
		while (this.pairIndex < this.pairComb.length) {
			head = this.pairComb[this.pairIndex];
			let flag = true;
			while (this.tailIndex < this.tailComb.length) {
				if (ignoreTail) {
					tail = this.tailComb[this.tailIndex];
				} else {
					tail = this.tailComb[this.tailIndex++];
				}
				if (!collections.any(head, function (val) {
					return tail.indexOf(val) >= 0;
				})) {
					if (ignoreTail) {
						this.pairIndex++;
					} else {
						if (this.tailIndex === this.tailComb.length) {
							this.pairIndex++;
							this.tailIndex = 0;
						}
					}
					this.consume = false;
					find = true;
					break
				} else {
					if (ignoreTail) {
						this.tailIndex++;
					}
					if (this.tailIndex === this.tailComb.length) {
						this.tailIndex = 0;
						this.pairIndex++;
						flag = false;
						break;
					}
				}
			}
			if (flag) {
				find = true;
				break
			}
		}
		this.head = head;
		this.tail = tail;
		if (ignoreTail) {
			this.tailIndex = 0;
		}
		return find;
	};

	iter.next = function () {
		if (this.hasNext()) {
			this.consume = true;
			var data = new Array(seqCount * 3 + seqCount * tailCount);
			for (var i = 0; i < seqCount; i++) {
				data.fill(this.head[i], i * 3, i * 3 + 3);
				data.fill(this.tail[i], seqCount * 3 + i * tailCount, seqCount * 3 + i * tailCount + tailCount)
			}
			return data;
		}
		return null;
	};

	return iter;
};

rules.seq_pair3_with_any = function (cardsInt, tailCount, ignoreTail) {
	let pairArr = rules.extract_pair(cardsInt, 3);
	if (pairArr < 2) {
		return rules.emptyIter(cardsInt, "seq_pair3_with_any_" + tailCount);
	}
	var iter = {};
	iter.source = cardsInt;
	iter.arr = [];
	for (var i = 0; i < pairArr.length - 1; i++) {
		iter.arr.push(rules.seq_pair3_x(cardsInt, i + 2, tailCount, ignoreTail));
	}
	iter.index = 0;
	iter.hasNext = function () {
		var cur = this.arr[this.index];
		if (!cur) {
			return false;
		}
		while (!cur || !cur.hasNext()) {
			if (!cur) {
				return false;
			}
			cur = this.arr[++this.index];
		}
		return true;
	};
	iter.next = function () {
		return this.arr[this.index].next();
	};
	return iter;
};

rules.seq_pair3_1 = function (cardsInt, sorted, converted, ignoreTail) {
	cardsInt = rules.convert(cardsInt, sorted, converted);
	return rules.seq_pair3_with_any(cardsInt, 1, ignoreTail);
};
rules.seq_pair3_2 = function (cardsInt, sorted, converted, ignoreTail) {
	cardsInt = rules.convert(cardsInt, sorted, converted);
	return rules.seq_pair3_with_any(cardsInt, 2, ignoreTail);
};

rules.CARDS_PRIORITY = [
	[rules.TYPE_SINGLE, rules.TYPE_PAIR2, rules.TYPE_PAIR3,
		rules.TYPE_PAIR3_1, rules.TYPE_PAIR3_2, rules.TYPE_PAIR4_2_1, rules.TYPE_PAIR4_2_2,
		rules.TYPE_SEQ_PAIR2, rules.TYPE_SEQ_PAIR3, rules.TYPE_SEQ_PAIR3_1, rules.TYPE_SEQ_PAIR3_2, rules.TYPE_SEQ],
	[rules.FLOWER],
	[rules.TYPE_PAIR4],
	[rules.TYPE_PAIR_JOKER]
];

rules.getPriority = function (type) {
	for (var i = 0; i < rules.CARDS_PRIORITY.length; i++) {
		if (rules.CARDS_PRIORITY[i].indexOf(type) >= 0) {
			return i;
		}
	}
	return -1;
};

rules.COMPARE_TYPE_FUNC_MAP = {};
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_SINGLE] = rules.is_single;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_PAIR_JOKER] = rules.is_pair_joker;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_PAIR2] = rules.is_pair2;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_PAIR3] = rules.is_pair3;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_PAIR3_1] = rules.is_pair3_1;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_PAIR3_2] = rules.is_pair3_2;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_PAIR4] = rules.is_pair4;
// rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_PAIR4_2] = rules.is_pair4_2;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_PAIR4_2_1] = rules.is_pair4_2_1;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_PAIR4_2_2] = rules.is_pair4_2_2;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_SEQ_PAIR2] = rules.is_seq_pair2;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_SEQ_PAIR3] = rules.is_seq_pair3;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_SEQ_PAIR3_1] = rules.is_seq_pair3_1;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_SEQ_PAIR3_2] = rules.is_seq_pair3_2;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_SEQ] = rules.is_seq;
rules.COMPARE_TYPE_FUNC_MAP[rules.TYPE_FLOWER] = rules.is_flower;

rules.SEQS = [rules.TYPE_SEQ, rules.TYPE_SEQ_PAIR2, rules.TYPE_SEQ_PAIR3, rules.TYPE_SEQ_PAIR3_1, rules.TYPE_SEQ_PAIR3_2];


/* 获取比传入牌型大的判断方法 */
rules.getGreaterThan = function (type) {
	let result = null;
	for (var i = 0; i < rules.CARDS_PRIORITY.length; i++) {
		if (result) {
			result = result.concat(rules.CARDS_PRIORITY[i])
		}
		if (!result && rules.CARDS_PRIORITY[i].indexOf(type) >= 0) {
			result = [];
		}
	}
	return result;
};

rules.ITER_TYPE_FUNC_MAP = {};
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_SINGLE] = rules.single;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_PAIR_JOKER] = rules.pair_joker;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_PAIR2] = rules.pair2;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_PAIR3] = rules.pair3;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_PAIR3_1] = rules.pair3_1;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_PAIR3_2] = rules.pair3_2;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_PAIR4] = rules.pair4;
// rules.ITER_TYPE_FUNC_MAP[rules.TYPE_PAIR4_2] = rules.pair4_2;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_SEQ_PAIR2] = rules.seq_pair2;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_SEQ_PAIR3] = rules.seq_pair3;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_SEQ_PAIR3_1] = rules.seq_pair3_1;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_SEQ_PAIR3_2] = rules.seq_pair3_2;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_SEQ] = rules.seq;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_PAIR4_2_1] = rules.pair4_2_1;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_PAIR4_2_2] = rules.pair4_2_2;
rules.ITER_TYPE_FUNC_MAP[rules.TYPE_FLOWER] = rules.flower;


rules.IGNORE_TAIL_FUNC = [rules.pair3_1, rules.pair3_2, rules.seq_pair3_1, rules.seq_pair3_2, rules.pair4_2_1, rules.pair4_2_2];
