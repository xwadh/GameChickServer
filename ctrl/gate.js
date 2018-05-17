let baseCtl = require('../facade/baseCtl');
let {NotifyType, OperEnum, ReturnCode} = require('../const/comm');

/**
 * 关卡管理器
 * Updated by liub on 2017-05-28.
 */
class gate extends baseCtl {
    /**
     * 查询关卡历史信息
     * @param user
     * @param objData
     */
    async query(user, objData){
        let ret = user.baseMgr.vip.doSomething({oper: OperEnum.Require});
        return ret;
    }

    /**
     * 开始一个关卡任务
     * @param user
     * @param objData
     */
    async start(user, objData)  {
        return user.baseMgr.vip.doSomething({oper: OperEnum.Start, id:objData.id});
    }

    /**
     * 扫荡
     * @param user
     * @param objDataa
     * @returns {Promise.<*>}
     */
    async sweep(user, objData){
        return user.baseMgr.vip.doSomething({oper: OperEnum.Sweep, id:objData.id});
    }

    async getSweepBonus(user, objData){
        return user.baseMgr.vip.doSomething({oper: OperEnum.SweepBonus});
    }

    /**
     * 查询、计算并下发体力值
     * @param user
     * @param objData
     * @returns {Promise.<void>}
     */
    async checkAction(user, objData){
        user.baseMgr.info.AutoAddAP();//刷新体力
        user.notify({type: NotifyType.action, info: user.baseMgr.info.getActionData()});
    }

    /**
     * 结束一个关卡任务
     * @param user
     * @param objData
     */
    async end(user, objData){
        objData.victoryaction = objData.victoryaction || 0;
        if(typeof objData.victoryaction == 'string'){
            objData.victoryaction = parseInt(objData.victoryaction);
        }

        return user.baseMgr.vip.doSomething({
            oper: OperEnum.PassTollgate,
            id: objData.id,
            blood: (typeof objData.blood == "string") ? parseInt(objData.blood) : objData.blood,
            money: (typeof objData.money == "string") ? parseInt(objData.money) : objData.money,
            score: (typeof objData.score == "string") ? parseInt(objData.score) : objData.score,
            super: (typeof objData.super == "string") ? parseInt(objData.super) : objData.super,
            moneyRate: !!objData.moneyrate ? Math.min(1, objData.moneyrate) : 0,     //金币加成
            scoreRate: !!objData.scorerate ? Math.min(1, objData.scorerate) : 0,     //分数加成
            bonusRate: !!objData.bonusrate ? Math.min(0.3, objData.bonusrate) : 0,   //奖励掉落加成
            action: Math.min(1, objData.victoryaction),     //胜利恢复体力值
        });
    }

    async startCatch(user, objData)  {
        return user.baseMgr.vip.doSomething({oper: OperEnum.StartCatch, id:objData.id});
    }

    async startEscape(user, objData)  {
        return user.baseMgr.vip.doSomething({oper: OperEnum.StartEscape, id:objData.id});
    }

    /**
     * 结束一个抓捕任务
     * @param user
     * @param objData
     */
    async catch(user, objData){
        return user.baseMgr.vip.doSomething({
            oper: OperEnum.Catch,
            id: objData.id,
            blood: (typeof objData.blood == "string") ? parseInt(objData.blood) : objData.blood,
        });
    }

    /**
     * 结束一个起义任务
     * @param user
     * @param objData
     */
    async escape(user, objData){
        return user.baseMgr.vip.doSomething({
            oper: OperEnum.Escape,
            id: objData.id,
            blood: (typeof objData.blood == "string") ? parseInt(objData.blood) : objData.blood,
        });
    }
}

exports = module.exports = gate;
