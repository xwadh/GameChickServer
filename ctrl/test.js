let baseCtl = require('../facade/baseCtl');

/**
 * 部分测试流程
 * Updated by liub on 2017-05-05.
 */
class test extends baseCtl {
    /**
     * 向消息发送者推送一条消息
     * @param user
     * @param objData
     * @returns {Promise.<void>}
     */
    async notify(user, objData) {
        user.notify({type: this.parent.const.NotifyType.none, info:objData.msg});
    }

    async echo(user, objData) {
        return {code: this.parent.const.ReturnCode.Success};
    }

    /**
     * （2017.9.18新增）测试一个逻辑服调用用另外一个逻辑服的功能函数：使用openid定位目标服
     * @param {*} user 
     * @param {*} objData 
     */
    async remote(user, objData){
        try{
            return this.parent.rpcCall('remote.test', [30, 20, {}], objData.openid);
        }
        catch(e){
            console.error(e);
        }
    }

    async sort(user, objData){
        let ret = [];
        for(let i=0;i<50000;i++){
            ret.push({id:i, score:i*5%50000});
        }
        console.time('sort');
        ret.sort((a,b)=>{return b.score - a.score});
        console.timeEnd('sort');
        return {code: this.parent.const.ReturnCode.Success};
    }
}

exports = module.exports = test;
