/**
 * Created by Administrator on 2017-03-21.
 */
var Sequelize = require('sequelize');
var conn = require('../util/sequel');

//建立数据库ORM模型
let Mail = (db, sa, pwd) => conn.seqConnector(db, sa, pwd).define(
    'Mail', 
    {
        src: Sequelize.STRING,
        dst: Sequelize.STRING,
        content: Sequelize.STRING,
        time: Sequelize.STRING,
        state: Sequelize.INTEGER
    },
    {
        // 是否需要增加createdAt、updatedAt、deletedAt字段
        'timestamps': false,
        // true表示删除数据时不会进行物理删除，而是设置deletedAt为当前时间
        'paranoid': false
    }
);
exports.Mail = Mail;