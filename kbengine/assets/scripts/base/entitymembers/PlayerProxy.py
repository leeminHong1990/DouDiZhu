# -*- coding: utf-8 -*-

import weakref
from functools import cmp_to_key

import const
from KBEDebug import *


class PlayerProxy(object):

	def __init__(self, avt_mb, owner, idx):
		# 玩家的mailbox
		self.mb = avt_mb
		# 所属的游戏房间
		self.owner = owner if isinstance(owner, weakref.ProxyType) else weakref.proxy(owner)
		# 玩家的座位号
		self.idx = idx
		# 新增一个房主标记位 代开房 和 玩家座位号会发生改变
		self.is_creator = 1 if ((idx == 0 and not self.owner.room_type) or (self.owner.agent and self.userId == self.owner.agent.userId)) else 0
		# 玩家在线状态
		self.online = 1
		# 玩家的手牌
		self.tiles = []
		# 玩家的所有操作记录 (cid, [tiles,])
		# 包括抢庄，下注，出牌
		self.op_r = []
		self.is_exchanged = False
		# 玩家当局的总得分
		self.score = 0
		# 玩家该房间总得分
		self.total_score = 0
		# 胡牌次数
		self.win_times = 0
		# 失败次数
		self.lose_times = 0

		# 明牌的倍数
		self.seen_mul = 0

		self.discard_times = 0

	# 用于UI显示的信息
	@property
	def head_icon(self):
		DEBUG_MSG("{} PlayerProxy {}: {} get head_icon = {}".format(self.owner.prefixLogStr, self.idx, self.nickname, self.mb.head_icon))
		return self.mb.head_icon

	@property
	def nickname(self):
		return self.mb.name

	@property
	def sex(self):
		return self.mb.sex

	@property
	def userId(self):
		return self.mb.userId

	@property
	def uuid(self):
		return self.mb.uuid

	@property
	def ip(self):
		return self.mb.ip

	@property
	def location(self):
		return self.mb.location

	@property
	def lat(self):
		return self.mb.lat

	@property
	def lng(self):
		return self.mb.lng

	def add_score(self, score):
		if self.owner.game_max_lose > 0 and self.score + score < -self.owner.game_max_lose:
			real_lose = -self.owner.game_max_lose - self.score
			self.score = -self.owner.game_max_lose
			return real_lose
		else:
			self.score += score
			return score

	def settlement(self):
		self.total_score += self.score

	def tidy(self):
		import deuces.card
		self.tiles = sorted(self.tiles, key=cmp_to_key(deuces.card.Card.card_compare))

	def reset(self):
		""" 每局开始前重置 """
		self.tiles = []
		self.op_r = []
		self.score = 0
		self.seen_mul = 0
		self.discard_times = 0

	def reset_all(self):
		self.reset()
		self.total_score = 0
		self.win_times = 0
		self.lose_times = 0

	def get_init_client_dict(self):
		return {
			'nickname': self.nickname,
			'head_icon': self.head_icon,
			'sex': self.sex,
			'idx': self.idx,
			'userId': self.userId,
			'uuid': self.uuid,
			'online': self.online,
			'ip': self.ip,
			'location': self.location,
			'lat': self.lat,
			'lng': self.lng,
			'is_creator': self.is_creator
		}

	def get_simple_client_dict(self):
		return {
			'nickname': self.nickname,
			'head_icon': self.head_icon,
			'sex': self.sex,
			'idx': self.idx,
			'userId': self.userId,
			'uuid': self.uuid,
			'score': self.total_score,
			'is_creator': self.is_creator,
		}

	def get_club_client_dict(self):
		return {
			'nickname': self.nickname,
			'idx': self.idx,
			'userId': self.userId,
			'score': self.total_score,
		}

	def get_round_client_dict(self):
		DEBUG_MSG("{} get_round_client_dict,{},{},{},{}".format(self.owner.prefixLogStr, self.idx, self.tiles, self.score, self.total_score))
		return {
			'idx': self.idx,
			'tiles': self.tiles,
			'score': self.score,
			'total_score': self.total_score,
		}

	def get_final_client_dict(self):
		return {
			'idx': self.idx,
			'win_times': self.win_times,
			'score': self.total_score,
			'lose_times': self.lose_times,
		}

	def get_reconnect_client_dict(self, userId):
		# 掉线重连时需要知道所有玩家打过的牌以及自己的手牌
		return {
			'idx': self.idx,
			'score': self.score,
			'total_score': self.total_score,
			'tiles': self.tiles if userId == self.userId else [0] * len(self.tiles),
			'op_list': self.process_op_record(),
			'final_op': self.op_r[-1][0] if len(self.op_r) > 0 else -1,
		}

	def get_round_result_info(self):
		# 记录信息后累计得分
		return {
			'userID': self.userId,
			'score': self.score,
		}

	def get_basic_user_info(self):
		return {
			'userID': self.userId,
			'nickname': self.nickname
		}

	def save_game_result(self, json_result):
		self.mb.saveGameResult(json_result)

	def process_op_record(self):
		""" 处理断线重连时候的牌局记录 """
		ret = []
		# Note: 处理加注记录
		# for i, op in enumerate(self.op_r):
		# 	pass
		return ret

	def discardTile(self, data, from_client):
		[self.tiles.remove(i) for i in data]

		self.discard_times += 1
		if len(self.tiles) != 0:
			next_idx = self.owner.nextIdx
		else:
			next_idx = self.idx
		self.op_r.append((const.OP_DISCARD, data))
		self.owner.op_record.append((const.OP_DISCARD, self.idx, next_idx, data))
		if from_client:
			self.owner.broadcastOperation2(self.idx, const.OP_DISCARD, data, next_idx)
		else:
			self.owner.broadcastOperation(self.idx, const.OP_DISCARD, data, next_idx)
		return next_idx
