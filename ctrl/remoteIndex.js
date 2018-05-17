let baseCtl = require('../facade/baseCtl');
let Indicator = require('../util/Indicator');
let {UserStatus} = require('../const/comm');

/**
 * 索引管理器
 * Updated by liub on 2017-05-12.
 */
class remoteIndex extends baseCtl {
    /**
     * 索引服收到的、从逻辑服发起的、调用另一个逻辑服上功能的远程调用
     * @param {*} svr 
     * @param {*} obj 
     */
    async remoteLogic(svr, obj){
        try{
            let uList = await this.parent.getUserIndexOfAll([`tx.IOS.${obj.msg.openid}`, `tx.Android.${obj.msg.openid}`]); 
            
            let u1 = uList[`tx.IOS.${obj.msg.openid}`];
            let u2 = uList[`tx.Android.${obj.msg.openid}`];

            let sim = null;
            if(!!u1 && !!u2){
                sim = u1.score > u2.score ? u1 : u2;
            }
            else if(!!u1){
                sim = u1;
            }
            else if(!!u2){
                sim = u2;
            }
            if(!!sim){
                return await this.parent.remoteCallReturn(sim, 'remoteLogic', obj.msg);
            }
        }
        catch(e){
            console.error(e);
        }
    }

    /**
     * 从逻辑服发起的、调用索引服上service功能的远程调用
     * @param {*} svr 
     * @param {*} obj 
     */
    async service(svr, obj){
        let msg = obj.msg;
        if(!!msg && !!this.parent.service[msg.sname] && !!this.parent.service[msg.sname][msg.sfunc]){
            return await this.parent.service[msg.sname][msg.sfunc](...msg.params);
        }
    }

    /**
     * 逻辑服请求注册
     * @param svr
     * @param obj
     */
    serverLogin(svr, obj){
        if(!!this.parent.serversInfo[svr.stype] && !!this.parent.serversInfo[svr.stype][svr.sid]){
            this.parent.service.users.mapServer(svr);
            //console.log(`${svr.stype}.${svr.sid}登录, 当前在线逻辑服：${this.parent.numOfOnline}`);
            //console.log(`${svr.stype}.${svr.sid}登录`);
            return {code: this.parent.const.ReturnCode.Success};
        }
        //没有查找到对应的服务器信息，拒绝注册
        return {code: this.parent.const.ReturnCode.illegalData};
    }

    /**
     * 模拟接口：提供模拟的好友列表
     * @param svr
     * @param obj
     */
    getFriendList(svr, obj){
        let items = [];
        for(let key of ['555', '666', '777', '888', '999','777.492', '777.493', '777.494', '777.495','5931C8CF1ECF97E5CC21F8D7D0CC3CEA',`B9EF3613446FA0032C43AB825B803A5A`]){
            if(obj.msg.openid != key){
                items.push({openid:key});
            }
        }
        return {ret:0, items: items}
    }

    /**
     * 获取好友排行榜
     * @param svr
     * @param obj
     * @returns {{code: number}}
     *
     * @note
     *      1、如果IOS、Android都有，那么取分数高的
     */
    async getFriendRankList(svr, obj){
        //对Redis采用批处理模式
        let uList = await this.parent.getUserIndexOfAll(obj.msg.list.reduce((sofar, cur)=>{
            sofar.push(`tx.IOS.${cur.openid}`);
            sofar.push(`tx.Android.${cur.openid}`);
            return sofar;
        }, [])); //需要查询的好友列表

        let list = []; //最终的查询结果
        obj.msg.list.map(item=>{
            let sim = null;

            let u1 = uList[`tx.IOS.${item.openid}`];
            let u2 = uList[`tx.Android.${item.openid}`];

            if(!!u1 && !!u2){
                sim = u1.score > u2.score ? u1 : u2;
            }
            else if(!!u1){
                sim = u1;
            }
            else if(!!u2){
                sim = u2;
            }

            if(!!sim){
                if(obj.msg.filter){//有过滤数据的要求
                    if(sim.score > 0){
                        list.push(sim);
                    }
                }
                else{
                    list.push(sim);
                }
            }
        });
        return {code: this.parent.const.ReturnCode.Success, data:{list: list}};
    }

    /**
     * 向用户下行消息，通过Index中转
     * @param svr
     * @param obj
     */
    async userNotify(svr, obj){
        let ui = await this.parent.getUserIndex(obj.msg.domain, obj.msg.openid);
        if(!!ui){
            this.parent.remoteCall(ui, "userNotify", obj.msg);
        }
    }

    /**
     * 设置用户的相关信息
     * @param svr
     * @param envelope
     * @returns {{code: number}}
     */
    async newAttr(svr, envelope){
        let ui = await this.parent.getUserIndex(envelope.msg.domain, envelope.msg.openid);
        if(!!ui && !!envelope.msg.attr){
            if(envelope.msg.attr.constructor == Array){ //一次修改多个属性
                envelope.msg.attr.map(item=>{
                    ui[item.type] = item.value;
                });
            }
            else{
                ui[envelope.msg.attr.type] = envelope.msg.attr.value;
            }
            await this.parent.setUserIndex(ui);
        }
    }
}

exports = module.exports = remoteIndex;
