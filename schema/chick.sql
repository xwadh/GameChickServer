-- --------------------------------------------------------
-- 主机:                           127.0.0.1
-- 服务器版本:                        5.7.17-log - MySQL Community Server (GPL)
-- 服务器操作系统:                      Win64
-- HeidiSQL 版本:                  9.4.0.5125
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- 导出  表 chick_ios_1.buylogs 结构
CREATE TABLE IF NOT EXISTS `buylogs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `domain` varchar(50) DEFAULT '0',
  `trade_no` varchar(50) DEFAULT NULL,
  `uuid` varchar(50) DEFAULT NULL,
  `product_id` varchar(50) DEFAULT NULL,
  `total_fee` varchar(50) DEFAULT NULL,
  `notify_time` varchar(50) DEFAULT NULL,
  `product_name` varchar(50) DEFAULT NULL,
  `request_count` varchar(50) DEFAULT NULL,
  `result` varchar(50) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trade_no` (`trade_no`)
) ENGINE=MyISAM AUTO_INCREMENT=217 DEFAULT CHARSET=utf8;

-- 数据导出被取消选择。
-- 导出  表 chick_ios_1.users 结构
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `score` int(11) NOT NULL DEFAULT '0',
  `name` varchar(50) NOT NULL DEFAULT 'player',
  `uuid` varchar(50) NOT NULL,
  `info` varchar(500) DEFAULT NULL,
  `setting` varchar(500) DEFAULT NULL,
  `rank` varchar(500) DEFAULT NULL,
  `domain` varchar(50) DEFAULT 'official',
  `hudong` varchar(1000) DEFAULT NULL,
  `friend` varchar(2000) DEFAULT NULL,
  `login` varchar(2000) DEFAULT NULL,
  `item` varchar(2000) DEFAULT NULL,
  `vip` varchar(500) DEFAULT NULL,
  `msg` varchar(2000) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `txinfo` varchar(2000) DEFAULT NULL,
  `txBule` varchar(2000) DEFAULT NULL,
  `txFriend` varchar(2000) DEFAULT NULL,
  `pet` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `domanId` (`uuid`,`domain`)
) ENGINE=InnoDB AUTO_INCREMENT=15028 DEFAULT CHARSET=utf8;

-- 数据导出被取消选择。
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
