let {UserStatus, ActivityType, BonusType, ReturnCode} = require('../const/comm');
let Mail = require("../model/mail");
let {now, ms} = require('../util/commonFunc');

/**
 * 消息管理器
 * Added by liub 2017.7.25
 */
class mails {
    constructor(parent){
        this.parent = parent;
        
        this.v = {};        //按照流水号索引的邮件列表
    }

    /**
     * 加载所有邮件
     * @returns {Promise.<void>}
     */
    async loadAll (db, sa, pwd){
        db = db || this.parent.sysCur.mysql.db;
        sa = sa || this.parent.sysCur.mysql.sa;
        pwd = pwd || this.parent.sysCur.mysql.pwd;

        let $expired = now() - 3600*24*30; //只读取一个月内的邮件
        try{
            let ret = await this.parent.models.Mail(db, sa, pwd).findAll({
                where: {
                    time: {$gt: $expired}
                }
            });
            ret.map(it=>{
                if(!this.v[it.dst]){
                    this.v[it.dst] = [];
                }
                this.v[it.dst].push(it);
            });
        } catch(e) {
            console.error(e);
        }
    };

    /**
     * 为指定用户构造收件箱内容
     */
    inbox(user){
        if(!this.v[user.openid]){
            this.v[user.openid] = [];
        }
        return this.v[user.openid];
    }

    /**
     * 新增一条消息
     * @note
     * 1、uo是社交链参照用户，真正收到邮件的是openid为dst的用户
     */
    async add(uo, content, src, dst){
        if(content.constructor == Object) { //数据库字段格式为string，此处适配下
            content = JSON.stringify(content);
        }

        try{
            let it = await this.parent.models.Mail().create({
                src: src,
                dst: dst,
                time: now(),
                content: content,
                state: 0            //未读取状态
            });

            if(!this.v[dst]){
                this.v[dst] = [];
            }
            this.v[dst].push(it);

            uo.DelegateByOpenid(user=>{
                user.baseMgr.info.SetStatus(UserStatus.newMsg); //为目标用户设置新邮件标志
            }, dst);

            return it;
        }
        catch(e){
            console.error(e);
        }
        return null;
    }

    /**
     * 标识：是否存在新邮件
     */
    newMsg(openid){
        if(!this.v[openid]){
            this.v[openid] = [];
        }

        let ret = false;
        for(let msg of this.v[openid]){
            if(msg.state == 0){
                ret = true;
                break;
            }
        }
        return ret;
    }

    /**
     * 读取邮件，同步检查是否有未领取奖励
     * @param {*} uo    用户对象 
     * @param {*} idx   邮件顺序索引号
     */
    async read(uo, idx){
        if(!this.v[uo.openid]){
            this.v[uo.openid] = [];
        }

        if(!!this.v[uo.openid][idx]){
            let msg = this.v[uo.openid][idx];
            if(msg.state == 0){ //只处理未读邮件
                msg.state = 1;
                msg.save();

                this.handleAdditional(uo, msg);

                if(!this.newMsg(uo.openid)){
                    uo.baseMgr.info.UnsetStatus(UserStatus.newMsg); 
                }
            }
        }

        return this.v[idx];
    }

    /**
     * 处理附件
     * @param {*} msg 
     */
    handleAdditional(user, msg){
        let $content = JSON.parse(msg.content);
        if(!!$content.info.bonus){ //有未领取奖励
            if(typeof $content.info.bonus == "string"){
                user.getBonus(user.convertBonus($content.info.bonus));
            }
            else{
                user.getBonus($content.info.bonus);
            }
        }
    }

    /**
     * 删除指定邮件
     * @param {*} uo 
     * @param {*} idx 
     */
    async delete(uo, idx){
        if(!!this.v[uo.openid] && !!this.v[uo.openid][idx]){
            if(this.v[uo.openid][idx].state == 0){ //只有删除未读邮件，才会引发状态变化
                this.handleAdditional(uo, this.v[uo.openid][idx]);

                if(!this.newMsg(uo.openid)){
                    uo.baseMgr.info.UnsetStatus(UserStatus.newMsg);
                }
            }

            let $id = this.v[uo.openid][idx].id;
            //从内存列表中删除
            this.v[uo.openid].splice(idx, 1);

            //从数据库删除
            this.parent.models.Mail().destroy({
                where:{id: $id}
            });
        }
    }
}

exports = module.exports = mails;
