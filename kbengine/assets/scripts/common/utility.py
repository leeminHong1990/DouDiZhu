# -*- coding: utf-8 -*-
import hashlib
import itertools
import json
import random
import time
from datetime import datetime, timedelta

import AsyncRequest
import const
import switch
import x42
from KBEDebug import *


def is_same_day(ts1, ts2):
	d1 = datetime.fromtimestamp(ts1)
	d2 = datetime.fromtimestamp(ts2)

	if (d1.year, d1.month, d1.day) == (d2.year, d2.month, d2.day):
		return True
	return False


def gen_uid(count):
	id_s = str(count)
	size = len(id_s)
	ran_num = pow(10, max(6 - size, 0))
	ran_fix = str(random.randint(ran_num, 10 * ran_num - 1))
	return int(ran_fix + id_s)


def gen_club_id(count):
	id_s = str(count)
	size = len(id_s)
	if size < 5:
		for i in range(1000):
			ran_num = pow(10, max(4 - size, 0))
			ran_fix = str(random.randint(ran_num, 10 * ran_num - 1))
			cid = int(ran_fix + id_s)
			if cid not in x42.ClubStub.clubs:
				return cid
	else:
		return count


def gen_room_id():
	if switch.DEBUG_BASE == 1:
		return 99999
	randomId = random.randint(10000, 99999)
	for i in range(89999):
		val = randomId + i
		if val > 99999:
			val = val % 100000 + 10000
		if val not in KBEngine.globalData["GameWorld"].rooms:
			return val
	return 99999


def filter_emoji(nickname):
	# try:
	# 	# UCS-4
	# 	highpoints = re.compile(u'[\U00010000-\U0010ffff]')
	# except re.error:
	# 	# UCS-2
	# 	highpoints = re.compile(u'[\uD800-\uDBFF][\uDC00-\uDFFF]')
	# nickname = highpoints.sub(u'', nickname)
	return nickname


# 发送网络请求
def get_user_info(accountName, callback):
	ts = int(time.mktime(datetime.now().timetuple()))
	tosign = accountName + "_" + str(ts) + "_" + switch.PHP_SERVER_SECRET
	m1 = hashlib.md5()
	m1.update(tosign.encode())
	sign = m1.hexdigest()
	url = switch.PHP_SERVER_URL + 'user_info_server'
	suffix = '?timestamp=' + str(ts) + '&unionid=' + accountName + '&sign=' + sign
	AsyncRequest.Request(url + suffix, lambda x: callback(x))


def get_is_proxy(accountName, callback):
	ts = get_cur_timestamp()
	to_sign = accountName + "_" + str(ts) + "_" + switch.PHP_SERVER_SECRET
	sign = get_md5(to_sign)
	url = switch.PHP_SERVER_URL + 'is_proxy'
	suffix = '?timestamp=' + str(ts) + '&unionid=' + accountName + '&sign=' + sign
	AsyncRequest.Request(url + suffix, lambda x: callback(x))


def update_card_diamond(accountName, deltaCard, deltaDiamond, callback, reason=""):
	ts = get_cur_timestamp()
	to_sign = accountName + "_" + str(ts) + "_" + str(deltaCard) + "_" + str(deltaDiamond) + "_" + switch.PHP_SERVER_SECRET
	# DEBUG_MSG("to sign::" + to_sign)
	sign = get_md5(to_sign)
	# DEBUG_MSG("MD5::" + sign)
	url = switch.PHP_SERVER_URL + 'update_card_diamond'
	data = {
		"timestamp": ts,
		"delta_card": deltaCard,
		"delta_diamond": deltaDiamond,
		"unionid": accountName,
		"sign": sign,
		"reason": reason
	}
	AsyncRequest.Post(url, data, lambda x: callback(x))


def update_card_diamond_aa(accountList, deltaCard, deltaDiamond, callback, reason=""):
	ts = get_cur_timestamp()
	account_json = json.dumps(accountList)
	to_sign = account_json + "_" + str(ts) + "_" + str(deltaCard) + "_" + str(deltaDiamond) + "_" + switch.PHP_SERVER_SECRET
	# DEBUG_MSG("to sign::" + to_sign)
	sign = get_md5(to_sign)
	# DEBUG_MSG("aa MD5::" + sign)
	url = switch.PHP_SERVER_URL + 'update_card_diamond_aa'
	data = {
		"timestamp": ts,
		"delta_card": deltaCard,
		"delta_diamond": deltaDiamond,
		"unionids": account_json,
		"sign": sign,
		"reason": reason
	}
	AsyncRequest.Post(url, data, lambda x: callback(x))


def update_valid_account(accountName, callback):
	to_sign = accountName + "_" + switch.PHP_SERVER_SECRET
	# DEBUG_MSG("to sign::" + to_sign)
	sign = get_md5(to_sign)
	# DEBUG_MSG("valid MD5::" + sign)
	url = switch.PHP_SERVER_URL + 'update_valid'
	data = {
		"unionid": accountName,
		"sign": sign,
	}
	AsyncRequest.Post(url, data, lambda x: callback(x))


def get_md5(data):
	m = hashlib.md5()
	m.update(data.encode())
	return m.hexdigest()


def get_cur_timestamp():
	return int(time.time())


def update_data_statistics(ts, avatar_num, online_num, room_num, callback):
	to_sign = const.GAME_NAME + "_" + str(ts) + "_" + str(avatar_num) + "_" + str(online_num) + "_" + str(room_num) + "_" + switch.PHP_SERVER_SECRET
	# INFO_MSG("stats to sign::" + to_sign)
	sign = get_md5(to_sign)
	# INFO_MSG("stats MD5::" + sign)
	url = switch.PHP_SERVER_URL + 'update_data_statistics'
	data = {
		"game_name": const.GAME_NAME,
		"timestamp": ts,
		"avatar_num": avatar_num,
		"online_num": online_num,
		"room_num": room_num,
		"sign": sign,
	}
	AsyncRequest.Post(url, data, lambda x: callback(x))


def update_dau(dau, callback):
	ts = get_cur_timestamp()
	to_sign = const.GAME_NAME + "_" + str(ts) + "_" + str(dau) + "_" + switch.PHP_SERVER_SECRET
	# INFO_MSG("dau to sign::" + to_sign)
	sign = get_md5(to_sign)
	# INFO_MSG("dau MD5::" + sign)
	url = switch.PHP_SERVER_URL + 'update_dau'
	data = {
		"game_name": const.GAME_NAME,
		"timestamp": ts,
		"num": dau,
		"sign": sign,
	}
	AsyncRequest.Post(url, data, lambda x: callback(x))


# 获取测试模式 初始信息
def getDebugPrefab(owner, callback):
	ts = int(time.mktime(datetime.now().timetuple()))
	url = '{}?timestamp={}&from=py&game={}&owner={}'.format(switch.PHP_DEBUG_URL, ts, const.DEBUG_JSON_NAME, owner)
	AsyncRequest.Request(url, lambda x: callback(x))


def get_seconds_till_n_days_later(begin, day, hour=0, minute=0, second=0):
	""" 获取第几天后的几点几分几秒的delta_time """
	dt = timedelta(days=day, hours=hour - begin.hour, minutes=minute - begin.minute, seconds=second - begin.second)
	seconds = dt.total_seconds()
	seconds = 0 if seconds <= 0 else seconds
	return seconds


def getRoomParams(create_dict):
	# @formatter:off
	return {
		'game_round'			: create_dict['game_round'],
		'game_mode'				: create_dict['game_mode'],
		'player_num'			: create_dict['player_num'],
		'hand_prepare'			: create_dict['hand_prepare'],
		'op_seconds'			: create_dict['op_seconds'],
		'room_type'				: create_dict['room_type'],
		'pay_mode'				: create_dict['pay_mode'],
		'max_boom_times'		: create_dict['max_boom_times'],
	}
	# @formatter:on


def issubset(superset, subset):
	"""
	判断subset是否是superset 的子集
	"""
	sub_len = len(subset)
	super_len = len(superset)
	if super_len < sub_len:
		return False
	if sub_len == 1:
		return subset[0] in superset
	groups = itertools.groupby(sorted(subset))
	for k, g in groups:
		if superset.count(k) < len(tuple(g)):
			return False
	return True
