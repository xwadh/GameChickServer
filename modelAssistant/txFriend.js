let CommonFunc = require('../util/commonFunc');
let baseMgr = require('../facade/baseMgr');

class txFriend extends baseMgr
{
    constructor(parent){
        super(parent, 'txFriend');
        //	数据 最大容量在60个好友左右，建议外部取好友列表控制在50个以内
        this.v 	= {
            friendList: {
                // 1 : {
                //         openid		        : '',
                //         nickname 	        : '',
                //         gender              : '',//性别“男”或“女”
                //         figureurl           : '',//头像地址
                //         is_blue_vip         : false,//是否蓝钻，是返回true，否则false
                //         blue_vip_level      : 0,//蓝钻等级
                //         is_blue_year_vip    : false,//是否年费蓝钻，是返回true，否则false
                //         is_super_blue_vip   : false,//是否豪华蓝钻，是返回true，否则false
                //         is_played           : false,//是否玩过当前游戏，是返回true，否则false
                //         friend_type         : 0,//好友类型 游戏好友为2，im好友为1，游戏关注人4，游戏黑名单8 二者同时为好友输出2
                //         friend_type_addition: 0,//未知
                // }
            },
        };
        this.refreshTime = 0;

        this.friends = {};
    }

    /**
     * 合并本地状态
     * @param item
     */
    refresh(item){
        if(item.openid != this.parent.openid){
            if(this.AddFriend(item.openid)){
                if(!!item.role){//保存好友使用的角色信息
                    this.v.friendList[item.openid].o = item.role;
                    this.dirty = true;
                }

                Object.keys(this.v.friendList[item.openid]).map(key=>{
                    item[key] = this.v.friendList[item.openid][key];
                });

                this.friends[item.openid] = item;
            }
        }
        return item;
    }

    /**
     * 跨天刷新
     * @constructor
     */
    DailyRefresh(){
        Object.keys(this.v.friendList).map(key=>{
            this.v.friendList[key].s = 0;
            this.v.friendList[key].r = 0;
        });
        this.dirty = true;
    }

    getRandomBonus(exec=false){
        let bonus = null;
        let rate = Math.random(), oriRate = 0, cfg = this.parent.router.config.fileMap.sayhelloreward;
        let arr = Object.keys(cfg);
        for(let i = 0; i < arr.length; i++){
            if(oriRate + cfg[arr[i]].rate > rate){
                bonus = this.parent.convertBonus(cfg[arr[i]].type);
                break;
            }
            oriRate += cfg[arr[i]].rate;
        }

        if(!!bonus && !!exec){
            this.parent.getBonus(bonus); //发放奖励
        }
        
        return bonus;
    }

    /**
     * 向指定好友点赞操作，失败返回0
     */
    sendHello(msg){
        if(msg.info.src == this.parent.openid && msg.info.dst != this.parent.openid){
            if(this.AddFriend(msg.info.dst)){
                if(this.parent.router.sysCur.debug || this.v.friendList[msg.info.dst].s <= 0){
                    this.dirty = true;
                    this.v.friendList[msg.info.dst].s = 1;      //记录点过的赞
                    this.v.friendList[msg.info.dst].h += 1;     //亲密度加1

                    msg.info.social = this.v.friendList[msg.info.dst].h;

                    return msg.info.social;
                }
            }
        }
        return 0;
    }

    /**
     * 被动收到好友的赞时，自动执行的操作
     * @param openid
     */
    recvHello(msg){
        if(msg.info.src != this.parent.openid && msg.info.dst == this.parent.openid){//不能给自己点赞
            //console.log('recvHello', this.parent.openid, openid);
            if(this.AddFriend(msg.info.src)){
                this.v.friendList[msg.info.src].r += 1;   //记录收到的赞
                this.v.friendList[msg.info.src].h += 1;   //亲密度加1
                this.dirty = true;

                return true;
            }
        }
        return false;
    }

    /**
     * 主动收取用户点赞带来的随机奖励，失败返回false
     */
    bonusHello(openid){
        //console.log('bonusHello', this.parent.openid, openid);
        if(openid != this.parent.openid){
            if(this.AddFriend(openid)){
                if(this.v.friendList[openid].r > 0){
                    this.dirty = true;
                    this.v.friendList[openid].r -= 1;

                    //计算、发放并返回随机奖励
                    return this.getRandomBonus(true);
                }
            }
        }
        return false;
    }

    getDefaultValue(){
        return {
            s:0,                        //发出的赞
            r:0,                        //收到的赞
            h:0,                        //亲密度
            o:1001,                     //所使用的角色
        }
    }

    /**
     * 获取好友列表
     */
    async getFriendList(){
        if(CommonFunc.now() - this.refreshTime > 60*10) {
            if(this.parent.router.sysCur.debug){
                try{
                    let apiRet = await this.parent.router.remoteCallReturn('getFriendList', {openid: this.parent.openid});
                    if (apiRet.ret == 0) {
                        this.dirty = true;
                        this.refreshTime = CommonFunc.now();
                        apiRet.items.map(item=>{
                            this.AddFriend(item.openid);
                        });
                    }
                    else {
                        console.log(`get_ranklist: ${JSON.stringify(apiRet)}`);
                    }
                }
                catch(e){
                    console.log(e);
                }
            }
            else{
                try{
                    // let apiRet = await this.parent.router.service.txApi.Get_App_Friends(
                    //     this.parent.openid,
                    //     this.parent.baseMgr.txInfo.GetOpenKey(),
                    //     this.parent.baseMgr.txInfo.GetPf(),
                    //     this.parent.router.sysCur.tx.appid, 1
                    // );
                    let apiRet = await this.parent.router.service.fbApi.Get_App_Friends(
                        this.parent.openid,
                        this.parent.baseMgr.txInfo.GetOpenKey(),
                    );
                    if (apiRet.ret == 0) {
                        this.dirty = true;
                        this.refreshTime = CommonFunc.now();
                        apiRet.items.map(item=>{
                            this.AddFriend(item.openid);
                        });
                    }
                    else {
                        console.log(`get_ranklist: ${JSON.stringify(apiRet)}`);
                    }
                }
                catch(e){
                    console.log(e);
                }
            }

            //删除错误数据
            Object.keys(this.v.friendList).map(key=>{
                if(key == "1" || key == this.parent.openid){
                    delete this.v.friendList[key];
                    this.dirty = true;
                }
            });
        }

        return this.v.friendList;
    }

    /**
     * 添加新的好友，不能超过50个
     * @param {*}  
     */
    AddFriend($fid){
        if($fid == this.parent.openid){
            return false;
        }

        if(!this.v.friendList[$fid]) {
            if(Object.keys(this.v.friendList).length >= 50){
                return false;
            }
            this.v.friendList[$fid] = this.getDefaultValue();
            this.dirty = true;
        }
        return true;
    }

    /**
     * 从本地缓存获取好友信息
     * @param {*}  
     */
    getFriend($fid){
        return this.friends[$fid];
    }

    /**
     * 强制从IndexServer获取好友信息, 同步失败则返回空
     * @param {*}  
     */
    async getFriendRemote($fid){
        if(!!this.friends[$fid]){
            return this.friends[$fid];
        }
        else{
            try{
                let result = await this.parent.router.remoteCallReturn('getFriendRankList', {list:[$fid], filter:false});
                if(result.data.list.length > 0){
                    return this.refresh(result.data.list[0]);
                }
            }
            catch(e){
                console.error(e);
            }
        }
        return null;
    }
}

exports = module.exports = txFriend;