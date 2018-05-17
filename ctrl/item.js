let baseCtl = require('../facade/baseCtl');

/**
 * 道具功能相关的控制器
 * Created by liub on 2017-04-08.
 */
class item extends baseCtl {
    useItem(pUser, info){
        return pUser.baseMgr.item.useItem(info.id, info.num);
    }

    list(pUser){
        return {code: this.parent.const.ReturnCode.Success, data:pUser.baseMgr.item.getList()};
    }
}

exports = module.exports = item;
