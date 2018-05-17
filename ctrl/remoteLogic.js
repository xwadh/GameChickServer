let baseCtl = require('../facade/baseCtl');

/**
 * 逻辑管理器
 * Updated by liub on 2017-05-12.
 */
class remoteLogic extends baseCtl {
    /**
     * 索引服通知预注册
     * @param svr
     * @param obj
     */
    userPreLogin(svr, obj){
        return this.parent.service.users.preLogin(obj.msg);
    }

    /**
     * 从其它逻辑服发起、经索引服中转、调用本逻辑服上功能的远程调用
     * @param {*} svr 
     * @param {*} obj 
     */
    async remoteLogic(svr, obj){
        let msg = obj.msg;
        if(!!msg && !!this.parent.service[msg.sname] && !!this.parent.service[msg.sname][msg.sfunc]){
            try{
                return await this.parent.service[msg.sname][msg.sfunc](...msg.params);
            }
            catch(e){
                console.error(e);
            }
        }
    }

    /**
     * 由索引服中转的下行消息: 下发给指定用户
     * @param svr
     * @param obj
     * @returns {number}
     */
    async userNotify(svr, obj){
        let ui = this.parent.service.users.GetUserByDomainId(`${obj.msg.domain}.${obj.msg.openid}`);
        if(!!ui){
            //通过Index中转的时候, 在原始消息体上包裹了目标用户信息, 此处进行剥离
            let body = obj.msg.msg;
            ui.socialNotify(body);
        }
        return {code: this.parent.const.ReturnCode.Success};
    }

    /**
     * 索引服查询统计信息
     * @param svr
     * @param obj
     * @returns {{code: number, data: {totalUser: Number, totalOnline: Number}}}
     */
    summary(svr, obj){
        return {code:this.parent.const.ReturnCode.Success, data:{totalUser:this.parent.numOfTotal, totalOnline: this.parent.numOfOnline, totalAmount: this.parent.service.log.amount}};
    }

    /**
     * 由Index中转的控制台命令
     * @param {*} svr 
     * @param {*} obj 
     */
    rpc(svr, obj){
        return this.parent.control.Console["command"](null, {data: obj.msg});
    }
}

exports = module.exports = remoteLogic;
