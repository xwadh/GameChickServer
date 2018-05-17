let baseCtl = require('../facade/baseCtl');

/**
 * 道具功能相关的控制器
 * Created by liub on 2017-04-08.
 */
class item extends baseCtl {
    upgrade(pUser, info){
        let ret = pUser.baseMgr.item.upgradeRole(info.id);
        if(ret.lv == 1) {//如果为新角色解锁，发送系统消息
            this.parent.control.chat.sendChat(pUser,{id:10,name:pUser.name,roldId:ret.id,c:"1",system:1});
        }
        return ret;
    }
    skill(pUser, info){
        return pUser.baseMgr.item.upgradeSkill(info.id,info.skid,info.price);
    }
    list(pUser){
        return {code: this.parent.const.ReturnCode.Success, data:pUser.baseMgr.item.getRoleList()};
    }
    share(pUser,info){
        let ret = pUser.baseMgr.item.roleShare(info.id,info.choose);
        return ret;
    }
    unlockedScene(pUser,info){
        return pUser.baseMgr.item.unlockedScene(info.sceneid);
    }
}

exports = module.exports = item;
