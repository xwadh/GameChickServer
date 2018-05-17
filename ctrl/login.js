let {em_Effect_Comm, UserStatus, NotifyType, OperEnum, BonusType, ReturnCode, ActionExecuteType} = require('../const/comm');
let baseCtl = require('../facade/baseCtl');

class login extends baseCtl
{
    /**
     * 用户登陆
     * @param pUser		用户
     * @param info		用户信息
     * @returns {{}}
     * @constructor
     */
    async UserLogin(pUser, info) {
        let ret   = {code:ReturnCode.Success};

        this.getFriendList(pUser,info); //获取好友列表
        if(!this.parent.service.mails.newMsg(pUser.openid)){
            pUser.baseMgr.info.UnsetStatus(UserStatus.newMsg, false); 
        }
        else{
            pUser.baseMgr.info.SetStatus(UserStatus.newMsg, false); 
        }

        ret.data = pUser.GetInfo();
        ret.data.time = pUser.time;     //标记令牌有效期的时间戳
        ret.data.id = pUser.id;         //本服唯一数字编号
        ret.data.openid = pUser.openid; //uuid
        ret.data.name = encodeURIComponent(pUser.name);     //用户昵称，客户端直接获取，info.name不再可用
        ret.data.token = pUser.sign;    //登录令牌

        //推送新手引导当前步骤，为0表示无引导
        pUser.baseMgr.vip.checkGuide();

        return ret;
    }

    /**
     * 获取好友信息列表，包括亲密度、点赞、在线状态、当前角色等
     *
     * @param user
     * @param objData
     * @returns {Promise.<void>}
     */
    async getFriendList(user, objData){
        try{
            let cache = await user.baseMgr.txFriend.getFriendList();

            let fns = Object.keys(cache).reduce((sofar, cur)=>{
                sofar.push({openid:cur});
                return sofar;
            }, []);

            if(!!fns && fns.length > 0){
                let result = await this.parent.remoteCallReturn('getFriendRankList', {list:fns, filter:false});

                //分包下行
                let pac = [];
                for(let idx in result.data.list){
                    //合并本地状态
                    pac.push(user.baseMgr.txFriend.refresh(result.data.list[idx]));
                    if(pac.length >= 20){
                        user.notify({type: NotifyType.friends, info: pac});
                        pac = [];
                    }
                }
                if(pac.length > 0){
                    user.notify({type: NotifyType.friends, info: pac});
                }

                return result;
            }
            else{
                user.notify({type: NotifyType.friends, info: []});
            }
        }catch(e){
            console.error(e);
        }
    }
    
    GetDayIntIn365(time) {
        var datetime = new Date(),
            gap = 0;
        //
        if(time) {
            datetime = time instanceof Date ? time : new Date(time);
            gap = 1;
        }
        //	一天的秒数
        var day_MillSeconds = 24 * 3600 * 1000;
        var year 			= datetime.getFullYear();
        //	新年第一天
        var firstDay 		= new Date(year, 0, 1);
        //
        var dayOfYear 		= (datetime-firstDay) / day_MillSeconds +  gap;
        return Math.ceil(dayOfYear);
    }
}
exports = module.exports = login;
