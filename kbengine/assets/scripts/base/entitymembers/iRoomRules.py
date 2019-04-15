# -*- coding: utf-8 -*-

import random

import const
import utility
from KBEDebug import *
from deuces.lookup import *

Rules = [
	is_single, is_flower, is_pair_joker, is_pair2, is_pair3, is_pair4,
	is_pair3_1, is_pair3_2,
	is_pair4_2_1, is_pair4_2_2,
	is_seq, is_seq_pair2, is_seq_pair3, is_seq_pair3_1, is_seq_pair3_2,
]


def get_greater_than_rules(target):
	result = None
	for arr in CARDS_PRIORITY:
		if result is not None:
			result += arr
		if result is None and target in arr:
			result = []

	return result


class iRoomRules(object):

	def __init__(self):
		# 房间的牌堆
		self.tiles = []

	def swapSeat(self, swap_list):
		random.shuffle(swap_list)
		for i in range(len(swap_list)):
			self.players_list[i] = self.origin_players_list[swap_list[i]]

		for i, p in enumerate(self.players_list):
			if p is not None:
				p.idx = i

	def initTiles(self):
		self.tiles = list(Card.ALL_CARD_INT)
		self.shuffle_tiles()

	def shuffle_tiles(self):
		random.shuffle(self.tiles)
		DEBUG_MSG("{} shuffle tiles:{}".format(self.prefixLogStr, self.tiles))

	def deal(self, prefabHandTiles):
		""" 发牌 """
		if prefabHandTiles is not None:
			for i, p in enumerate(self.players_list):
				if p is not None and len(prefabHandTiles) >= 0:
					p.tiles = prefabHandTiles[i] if len(prefabHandTiles[i]) <= const.INIT_TILE_NUMBER else prefabHandTiles[i][0:const.INIT_TILE_NUMBER]
			all_tiles = []
			for i, p in enumerate(self.players_list):
				p is not None and all_tiles.extend(p.tiles)
			for t in all_tiles:
				t in self.tiles and self.tiles.remove(t)
			for i in range(const.INIT_TILE_NUMBER):
				for j, p in enumerate(self.players_list):
					if len(p.tiles) >= const.INIT_TILE_NUMBER:
						continue
					p.tiles.append(self.tiles.pop(0))
		else:
			for i, p in enumerate(self.players_list):
				if const.INIT_TILE_NUMBER > 0:
					for j in range(const.INIT_TILE_NUMBER):
						p.tiles.append(self.tiles.pop(0))

		for i, p in enumerate(self.players_list):
			p is not None and DEBUG_MSG("{} idx:{} deal tiles:{}".format(self.prefixLogStr, i, p.tiles))

	def tidy(self):
		""" 整理 """
		for i in range(self.player_num):
			self.players_list[i] and self.players_list[i].tidy()

	def throwDice(self, idxList):
		pass

	def exchange_cards(self, cards, target):
		DEBUG_MSG("{} exchange_cards {} - {}".format(self.prefixLogStr, cards, target))
		count = len(target)
		self.tiles.extend(target)
		self.shuffle_tiles()
		for i in range(0, count):
			cards.remove(target[i])
			cards.append(self.tiles.pop(0))

	def can_operation(self, idx, aid):
		return (self.cur_allow_op & aid) == aid

	def can_exchange(self, idx, data):
		return (self.cur_allow_op & const.OP_EXCHANGE) == const.OP_EXCHANGE and all(c in self.players_list[idx].tiles for c in data)

	def can_bet(self, idx, score):
		return (self.cur_allow_op & const.OP_BET) == const.OP_BET and self.bet_score_list[idx] == -1

	def can_fight_dealer(self, idx):
		return (self.cur_allow_op & const.OP_FIGHT_DEALER) == const.OP_FIGHT_DEALER and (self.fight_dealer_mul_list[idx] == -1 or self.fight_dealer_mul_list[idx] / const.GET_DEALER_MUL == 1)

	def can_discard(self, idx, data):
		if (self.cur_allow_op & const.OP_DISCARD) == const.OP_DISCARD and utility.issubset(self.players_list[idx].tiles, data):
			cards_int = sorted(list(map(Card.get_rank_int, data)))
			if self.last_discard_idx == idx or self.last_discard_idx == -1:
				return any(map(lambda x: x(cards_int), Rules))

			def compare(info_a, info_b):
				if info_a[1] in SEQS:
					if info_b[2] > info_a[2] and info_b[3] - info_b[2] == info_a[3] - info_a[2]:
						return info_b[2] - info_a[2]
				else:
					return Card.card_compare(info_b[2], info_a[2])

				return -1

			last_cards = None
			for cards in reversed(self.discard_record):
				if cards and len(cards) > 0:
					last_cards = cards
					break

			last_cards = sorted(list(map(Card.get_rank_int, last_cards)))

			last_info = None
			for rule in Rules:
				info = rule(last_cards)
				if info[0]:
					last_info = info
					break
			if last_info is None:
				return False
			dest_info = COMPARE_TYPE_FUNC_MAP[last_info[1]](cards_int)
			if dest_info[0]:
				return compare(last_info, dest_info) > 0

			types = get_greater_than_rules(last_info[1])
			if types is not None:
				for t in types:
					dest_info = COMPARE_TYPE_FUNC_MAP[t](cards_int)
					if dest_info[0]:
						return True

		return False

	def can_pass(self, idx):
		return (self.cur_allow_op & const.OP_PASS) == const.OP_PASS and not (self.last_discard_idx == idx or self.last_discard_idx == -1)

	def getNotifyOpList(self, aid):
		# notifyOpList 和 self.wait_op_info_list 必须同时操作
		# 数据结构：问询玩家，操作类型，状态，数据
		notify_op_list = [[] for i in range(self.player_num)]
		self.wait_op_info_list = []
		return notify_op_list

	def cal_score(self, win_idx):
		# base_score = const.BASE_SCORE_DEALER if win_idx == self.dealer_idx else const.BASE_SCORE_FARMER
		base_score = 1
		score = 0
		spring_mul = 2 if self.is_spring(win_idx) else 1
		if self.game_mode == const.GAME_MODE_SCORE:
			bet_score = self.bet_score_list[self.dealer_idx]
			score = base_score * bet_score * (2 ** self.boom_times) * spring_mul
		elif self.game_mode == const.GAME_MODE_DEALER:
			mul = 1
			for i in filter(lambda x: x > 0, self.fight_dealer_mul_list):
				mul *= i
			score = base_score * (2 ** self.boom_times) * mul * spring_mul
		else:
			DEBUG_MSG("{} cal score: unknown".format(self.prefixLogStr))

		for i, p in enumerate(self.players_list):
			if win_idx == self.dealer_idx:
				if i == win_idx:
					p.add_score(score * 2)
				else:
					p.add_score(-score)
			else:
				if i == self.dealer_idx:
					p.add_score(-score * 2)
				else:
					p.add_score(score)

		DEBUG_MSG("{} scores : win:{} ==> {}".format(self.prefixLogStr, win_idx, [p.score for p in self.players_list]))

	def get_min_tiles(self, idx):
		tiles = self.players_list[idx].tiles
		min = 0
		tmp = tuple(map(Card.get_rank_int, tiles))
		for i, t in enumerate(tmp):
			if t == 2:
				t = t + 13
			if i == 0:
				min = t
			else:
				if min > t:
					min = t
		if min - 13 == 2:
			min = 2
		return list(filter(lambda x: Card.get_rank_int(x) == min, tiles))

	def is_spring(self, win_idx):
		if win_idx == self.dealer_idx:
			for i, p in enumerate(self.players_list):
				if p.discard_times != 0 and i != win_idx:
					return False
			return True
		else:
			return self.players_list[self.dealer_idx].discard_times == 1
