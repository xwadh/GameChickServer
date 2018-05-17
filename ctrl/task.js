let baseCtl = require('../facade/baseCtl');

/**
 * 配置管理器
 * Updated by liub on 2017-05-05.
 */
class task extends baseCtl {
    async list(user, objData){
        return {
            code: this.parent.const.ReturnCode.Success,
            data: user.baseMgr.task.getList(objData.type, objData.status)
        }
    }

    async getBonus(user, objData){
        return {
            code: this.parent.const.ReturnCode.Success,
            data: user.baseMgr.task.getBonus(objData.id)
        }
    }
    async getInfo(user,objData){
        return {
            code: this.parent.const.ReturnCode.Success,
            data: user.baseMgr.task.getTaskObj(objData.id)
        }
    }
}

exports = module.exports = task;
