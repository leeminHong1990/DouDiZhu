# -*- coding: utf-8 -*-
import functools
import itertools

from deuces.card import Card

TYPE_SINGLE = 0
TYPE_PAIR_JOKER = 1
TYPE_PAIR2 = 2
TYPE_PAIR3 = 3
TYPE_PAIR3_1 = 4
TYPE_PAIR3_2 = 5
TYPE_PAIR4 = 6
# TYPE_PAIR4_2 = 7
TYPE_SEQ_PAIR2 = 8
TYPE_SEQ_PAIR3 = 9
TYPE_SEQ_PAIR3_1 = 10
TYPE_SEQ_PAIR3_2 = 11
TYPE_SEQ = 12
TYPE_PAIR4_2_1 = 13
TYPE_PAIR4_2_2 = 14
TYPE_FLOWER = 15


def convert(func):
	@functools.wraps(func)
	def call_func(*args, **kwargs):
		cards_int = args[0]
		if kwargs is not None:
			if "converted" in kwargs and not kwargs["converted"]:
				cards_int = list(map(Card.get_rank_int, cards_int))
			if "sorted" in kwargs and not kwargs["sorted"]:
				cards_int = sorted(cards_int)
		return func(cards_int, **kwargs)

	return call_func


def extract_pair(ints, count):
	""" 提取数组中的对子 """
	groups = itertools.groupby(ints)
	arr = []
	for key, g in groups:
		l = len(tuple(g))
		if l >= count:
			# arr.extend([key for _ in range(0, int(l / count))])
			arr.append(key)
	return arr


def is_single(cards_int, **kwargs):
	return len(cards_int) == 1, TYPE_SINGLE, cards_int[0]


def is_flower(cards_int, **kwargs):
	return len(cards_int) == 1 and cards_int[0] == Card.FLOWER, TYPE_FLOWER, cards_int[0]


def is_pair_joker(cards_int, **kwargs):
	return len(cards_int) == 2 and sum(cards_int) == Card.BIG_JOKER + Card.LITTLE_JOKER, TYPE_PAIR_JOKER, cards_int[0]


@convert
def is_pair2(cards_int, **kwargs):
	return len(cards_int) == 2 and cards_int[0] == cards_int[1], TYPE_PAIR2, cards_int[0]


@convert
def is_pair3(cards_int, **kwargs):
	return len(cards_int) == 3 and sum(cards_int) == cards_int[0] * 3, TYPE_PAIR3, cards_int[0]


@convert
def is_pair3_1(cards_int, **kwargs):
	if not len(cards_int) == 4:
		return False, TYPE_PAIR3_1, -1
	p = sum(cards_int)
	c0 = cards_int[0]
	c2 = cards_int[3]
	f1 = c2 * 3 + c0
	f2 = c0 * 3 + c2
	return f1 - f2 == (c2 - c0) * 2 and (p == f2 or p == f1) and c0 != c2, TYPE_PAIR3_1, c0 if p == f2 else c2


@convert
def is_pair3_2(cards_int, **kwargs):
	if not len(cards_int) == 5:
		return False, TYPE_PAIR3_2, -1
	groups = itertools.groupby(cards_int)
	has3 = False
	has2 = False
	primary = -1
	for key, g in groups:
		l = len(tuple(g))
		if l == 3:
			has3 = True
			primary = key
		elif l == 2:
			has2 = True
		else:
			return False, TYPE_PAIR3_2, -1
	return has2 and has3, TYPE_PAIR3_2, primary


@convert
def is_pair4(cards_int, **kwargs):
	return len(cards_int) == 4 and sum(cards_int) == cards_int[0] * 4, TYPE_PAIR4, cards_int[0]


def is_pair4_2_x(cards_int, card_type, tail_count):
	if not len(cards_int) == 4 + tail_count * 2:
		return False, card_type, -1
	groups = itertools.groupby(cards_int)
	has4 = False
	count1 = 0
	count2 = 0
	primary = -1
	for key, g in groups:
		l = len(tuple(g))
		if l == 4:
			has4 = True
			primary = key
		else:
			if l == 1:
				count1 += 1
			elif l == 2:
				count2 += 1
			else:
				return False, card_type, -1
	if tail_count == 1:
		has2 = (count1 == 2 and count2 == 0) or (count1 == 0 and count2 == 1)
	else:
		has2 = count1 == 0 and count2 == 2
	return has4 and has2, card_type, primary


@convert
def is_pair4_2_1(cards_int, **kwargs):
	return is_pair4_2_x(cards_int, TYPE_PAIR4_2_1, 1)


@convert
def is_pair4_4(cards_int, **kwargs):
	if len(cards_int) != 8:
		return False, TYPE_PAIR4_2_2, -1
	groups = itertools.groupby(cards_int)
	count = 0
	primary = 0
	for key, g in groups:
		if len(g) == 4:
			primary = max(primary, key)
			count += 1
		else:
			return False, TYPE_PAIR4_2_2, -1
	return count == 2, TYPE_PAIR4_2_2, primary


@convert
def is_pair4_2_2(cards_int, **kwargs):
	data = is_pair4_2_x(cards_int, TYPE_PAIR4_2_2, 2)
	if data[0]:
		return data
	return is_pair4_4(cards_int, sorted=True, converted=True)


@convert
def is_seq_pair2(cards_int, **kwargs):
	l = len(cards_int)
	if l % 2 != 0 or l < 6:
		return False, TYPE_SEQ_PAIR2, -1, -1
	return cards_int[0] != 2 and cards_int[l - 1] - cards_int[0] == l / 2 - 1 and (cards_int[0] + cards_int[l - 1]) * (l / 2) == sum(cards_int), TYPE_SEQ_PAIR2, cards_int[0], cards_int[-1]


@convert
def is_seq_pair3(cards_int, **kwargs):
	l = len(cards_int)
	if l % 3 != 0 or l < 6:
		return False, TYPE_SEQ_PAIR3, -1, -1
	return cards_int[0] != 2 and cards_int[l - 1] - cards_int[0] == l / 3 - 1 and (cards_int[0] + cards_int[l - 1]) / 2 * l == sum(cards_int), TYPE_SEQ_PAIR3, cards_int[0], cards_int[-1]


def is_seq_pair3_with_any(cards_int, tail_count):
	cards_len = len(cards_int)
	if cards_len % (3 + tail_count) != 0 and cards_len < (3 + tail_count) * 2:
		return False, -1, -1

	pair3_arr = extract_pair(cards_int, 3)  # sorted
	pair_len = len(pair3_arr)
	if pair_len < 2:
		return False, -1, -1

	c0 = pair3_arr[0]
	c1 = pair3_arr[pair_len - 1]
	if c0 > 2 and c1 - c0 == pair_len - 1 and sum(pair3_arr) * 2 == (c0 + c1) * pair_len:
		other_count = cards_len - pair_len * 3
		if other_count != pair_len * tail_count:
			return False, -1, -1
		others = []
		for card in cards_int:
			card not in pair3_arr and others.append(card)

		if len(extract_pair(others, tail_count)) == pair_len:
			return True, c0, c1
	return False, -1, -1


@convert
def is_seq_pair3_1(cards_int, **kwargs):
	return is_seq_pair3_with_any(cards_int, 1)


@convert
def is_seq_pair3_2(cards_int, **kwargs):
	return is_seq_pair3_with_any(cards_int, 2)


@convert
def is_seq(cards_int, **kwargs):
	l = len(cards_int)
	if l < 5:
		return False, TYPE_SEQ, -1, -1
	c0 = cards_int[0]
	c1 = cards_int[l - 1]
	return c0 > 2 and c1 - c0 == l - 1 and sum(cards_int) * 2 == (c0 + c1) * l, TYPE_SEQ, c0, c1


@convert
def single(cards_int, **kwargs):
	return cards_int


@convert
def pair2(cards_int, **kwargs):
	groups = itertools.groupby(cards_int)
	return iter(filter(lambda x: len(x) > 1, map(lambda g: tuple(g[1]), groups)))


@convert
def pair3(cards_int, **kwargs):
	groups = itertools.groupby(cards_int)
	return iter(filter(lambda x: len(x) > 2, map(lambda g: tuple(g[1]), groups)))


@convert
def pair3_1(cards_int, **kwargs):
	if len(cards_int) >= 4:
		pair3_arr = extract_pair(cards_int, 3)
		for p in pair3_arr:
			singles = set(cards_int)
			singles.remove(p)
			for s in singles:
				yield (p, s)


@convert
def pair3_2(cards_int, **kwargs):
	if len(cards_int) >= 5:
		pair3_arr = extract_pair(cards_int, 3)
		for p in pair3_arr:
			pair2s = set(extract_pair(cards_int, 2))
			pair2s.remove(p)
			for s in pair2s:
				yield (p, s)


@convert
def pair4(cards_int, **kwargs):
	groups = itertools.groupby(cards_int)
	return iter(filter(lambda x: len(x) > 3, map(lambda g: tuple(g[1]), groups)))


@convert
def seq_pair2(cards_int, **kwargs):
	""" 3,3,4,4,5,5 """
	if len(cards_int) < 6:
		return
	pair2_arr = extract_pair(cards_int, 2)
	if len(pair2_arr) == 0:
		return
	for i in range(3, len(pair2_arr) + 1):
		for c in itertools.combinations(pair2_arr, i):
			l = len(c)
			if c[0] > 2 and 2 * sum(c) == (c[0] + c[l - 1]) * l and c[l - 1] - c[0] == l - 1:
				yield c


@convert
def seq_pair3(cards_int, **kwargs):
	""" 3,3,3,4,4,4,5,5,5 """
	if len(cards_int) < 6:
		return
	pair3_arr = extract_pair(cards_int, 3)
	if len(pair3_arr) == 0:
		return
	for i in range(2, len(pair3_arr) + 1):
		for c in itertools.combinations(pair3_arr, i):
			l = len(c)
			if c[0] > 2 and 2 * sum(c) == (c[0] + c[l - 1]) * l and c[l - 1] - c[0] == l - 1:
				yield c


@convert
def seq_pair3_1(cards_int, **kwargs):
	""" 3,3,3,4,4,4,7,9"""
	if len(cards_int) >= 8:
		for pair in seq_pair3(cards_int, **kwargs):
			tmp = set(cards_int).difference(pair)
			l = len(pair)
			if len(tmp) >= l:
				for comb in itertools.combinations(tmp, l):
					yield (pair, comb)


@convert
def seq_pair3_2(cards_int, **kwargs):
	""" 3,3,3,4,4,4,7,7,9,9"""
	if len(cards_int) >= 10:
		for pair in seq_pair3(cards_int, **kwargs):
			tmp = set(extract_pair(cards_int, 2)).difference(pair)
			l = len(pair)
			if len(tmp) > l:
				for comb in itertools.combinations(tmp, l):
					yield (pair, comb)


@convert
def seq(cards_int, **kwargs):
	if len(cards_int) > 4:
		s = set(cards_int)
		2 in s and s.remove(2)
		if len(s) > 4:
			for l in range(5, len(s) + 1):
				for comb in itertools.combinations(s, l):
					if is_seq(comb):
						yield comb


CARDS_PRIORITY = [
	[TYPE_SINGLE, TYPE_PAIR2, TYPE_PAIR3,
	 TYPE_PAIR3_1, TYPE_PAIR3_2, TYPE_PAIR4_2_1, TYPE_PAIR4_2_1,
	 TYPE_SEQ_PAIR2, TYPE_SEQ_PAIR3, TYPE_SEQ_PAIR3_1, TYPE_SEQ_PAIR3_2, TYPE_SEQ],
	[TYPE_FLOWER],
	[TYPE_PAIR4],
	[TYPE_PAIR_JOKER]
]

COMPARE_TYPE_FUNC_MAP = {
	TYPE_SINGLE: is_single,
	TYPE_PAIR_JOKER: is_pair_joker,
	TYPE_PAIR2: is_pair2,
	TYPE_PAIR3: is_pair3,
	TYPE_PAIR3_1: is_pair3_1,
	TYPE_PAIR3_2: is_pair3_2,
	TYPE_PAIR4: is_pair4,
	TYPE_PAIR4_2_1: is_pair4_2_1,
	TYPE_PAIR4_2_2: is_pair4_2_2,
	TYPE_SEQ_PAIR2: is_seq_pair2,
	TYPE_SEQ_PAIR3: is_seq_pair3,
	TYPE_SEQ_PAIR3_1: is_seq_pair3_1,
	TYPE_SEQ_PAIR3_2: is_seq_pair3_2,
	TYPE_SEQ: is_seq,
	TYPE_FLOWER: is_flower
}

SEQS = [TYPE_SEQ, TYPE_SEQ_PAIR2, TYPE_SEQ_PAIR3, TYPE_SEQ_PAIR3_1, TYPE_SEQ_PAIR3_2]
