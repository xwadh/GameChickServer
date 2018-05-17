var baseCtl = require('../facade/baseCtl');

/**
 * 排行榜控制器
 */
class rank extends baseCtl {
    constructor(parent){
        super(parent);

        //总排行榜
        this.g_rankData	 = [];
        //每日排行榜
        this.dailyRank = [];
        //公司排行榜
        this.compaynRank = [];
        //记录每日排行榜的最初生成日期
        this.dailyDay = (new Date()).toDateString();

        this.g_rankTop = [];
        this.dailyRankTop = [];
    }

    /**
     * 类工厂，用来创建排名项
     * @param id
     * @param name
     * @param score
     * @returns {{id: *, name: *, score: *, rank: number}}
     */
    itemFactory(id, name, score){
        return {
            id:id,
            name:name,
            score:score
        };
    }

    /**
     * 检测跨天，及时复位每日榜单
     * @param day
     */
    checkDailyRank(day){
        if(this.dailyDay != day){ //跨天
            this.dailyDay = day;
            this.dailyRank = [];
        }
    }

    /**
     * 获取排行榜信息
     * @param rType
     * @param id
     * @returns {{code: number, data: {}}}
     * @constructor
     */
    GetRankData(user, objData, rType = this.parent.const.RankType.total) {
        let ret = {code: this.parent.const.ReturnCode.Success, data:{}};
        switch(rType){
            case this.parent.const.RankType.friend: //公司榜
                ret.data.list = this.compaynRank;
                ret.data.list.map(item=>{
                    let usr = this.parent.service.users.GetUser(item.id);
                    if(!!usr){
                        item.icon = usr.baseMgr.info.GetHeadIcon();
                    }
                });
                ret.data.rank = user.baseMgr.info.GetRank(this.parent.const.RankType.friend);
                break;

            case this.parent.const.RankType.daily:  //日榜
                ret.data.list = this.dailyRank;
                ret.data.list.map(item=>{
                    let usr = this.parent.service.users.GetUser(item.id);
                    if(!!usr){
                        item.icon = usr.baseMgr.info.GetHeadIcon();
                    }
                });
                ret.data.rank = user.baseMgr.info.GetRank(this.parent.const.RankType.daily);
                break;

            case this.parent.const.RankType.total:  //总榜
                ret.data.list = this.g_rankData;
                ret.data.list.map(item=>{
                    let usr = this.parent.service.users.GetUser(item.id);
                    if(!!usr){
                        item.icon = usr.baseMgr.info.GetHeadIcon();
                    }
                });
                ret.data.rank = user.baseMgr.info.GetRank(this.parent.const.RankType.total);
                break;
            default:
                break;
        }
        return ret;
    }

    /**
     * 过滤、排序总榜和每日榜
     */
    sortRank(){
        this.compaynRank = this.compaynRank.filter(it=>{return it.score >= 1;}).sort((a, b)=>{return b.score - a.score;});
        this.dailyRank = this.dailyRank.filter(it=>{return it.score >= 1;}).sort((a, b)=>{return b.score - a.score;});
        this.g_rankData = this.g_rankData.filter(it=>{return it.score >= 1;}).sort((a, b)=>{return b.score - a.score;});
    }

    /**
     * 从数据库中添加排行榜条目
     * @param rType     榜单类型
     * @param pUser     更新榜单的玩家
     * @constructor
     */
    LoadRankData(rType, pUser) {
        if(!pUser){return;}
        let infoMgr = {id:pUser.id, name:pUser.name, score:0, rank: 0};   //用来排名的数据，score暂时置空，后面根据rType相应赋值
        let rankData = [];      //和rType相对应的排行榜对象，后面根据rType相应赋值
        switch(rType){ //根据rType的不同，相应恢复总榜、每日榜单
            case this.parent.const.RankType.friend:
                infoMgr.score = pUser.baseMgr.info.level;
                infoMgr.rank = pUser.baseMgr.info.v.rankc;
                rankData = this.compaynRank;
                break;

            case this.parent.const.RankType.daily:
                infoMgr.score = pUser.baseMgr.info.scored;
                infoMgr.rank = pUser.baseMgr.info.v.rankd;
                rankData = this.dailyRank;
                break;

            case this.parent.const.RankType.total:
                infoMgr.score = pUser.baseMgr.info.score;
                infoMgr.rank = pUser.baseMgr.info.v.rank;
                rankData = this.g_rankData;
                break;
        }

        if (infoMgr.rank <= 100 && infoMgr.rank > 0.9) {
            rankData.push(this.itemFactory(infoMgr.id, infoMgr.name, infoMgr.score));
        }
    }

    /**
     * 更新排行榜数据
     * @param rType         //要更新的榜单类型 总榜 好友 每日
     * @param pUser         //更新榜单的玩家
     * @constructor
     */
    UpdateRankData(rType, pUser) {
        if(!pUser){return;}

        let infoMgr = {id:pUser.id, name:pUser.name, score:0};   //用来排名的数据，score暂时置空，后面根据rType相应赋值
        let rankData = [];      //和rType相对应的排行榜对象，后面根据rType相应赋值

        switch(rType){ //根据rType的不同，相应处理总榜、好友、每日三张榜单
            case this.parent.const.RankType.friend:
                infoMgr.score = pUser.baseMgr.info.level;
                rankData = this.compaynRank;
                break;
            case this.parent.const.RankType.daily:
                infoMgr.score = pUser.baseMgr.info.scored;
                rankData = this.dailyRank;
                break;
            case this.parent.const.RankType.total:
            default:
                infoMgr.score = pUser.baseMgr.info.score;
                rankData = this.g_rankData;
                break;
        }

        let isFind = false;
        for(let idx in rankData){
            if(rankData[idx].id == infoMgr.id){//已经存在记录，直接更新分数和名称信息
                isFind = true;
                rankData[idx].score = infoMgr.score;
                rankData[idx].name = infoMgr.name;
                break;
            }
        }

        if(!isFind && infoMgr.score>0){//	如果还没有名次, 则尝试向数组中插入
            if (rankData.length < this.parent.DataConst.threshold.rankNumber) {
                rankData.push(this.itemFactory(infoMgr.id, infoMgr.name, infoMgr.score));
            }
            else {
                let lastUserInfo = rankData[rankData.length - 1];
                if (lastUserInfo.score >= infoMgr.score) {//小于最后一名
                    pUser.baseMgr.info.SetRank(0, rType);
                    return ;
                }

                let lastUser = this.parent.service.users.GetUser(lastUserInfo.id);
                if (lastUser) {
                    //	设置这名玩家离开排行榜
                    lastUser.baseMgr.info.SetRank(0, rType);
                }
                //	设置当前玩家加入到排行榜中
                rankData.pop();
                rankData.push(this.itemFactory(infoMgr.id, infoMgr.name, infoMgr.score));
            }
        }

        //对更新了分数的榜单进行排序
        rankData.sort((a, b)=>{return b.score - a.score;});

        //在排序过的榜单上，标注每个人的名次
        for(let idx in rankData){
            let sim = this.parent.service.users.GetUser(rankData[idx].id);
            if(!!sim){
                sim.baseMgr.info.SetRank(parseInt(idx)+1, rType);
            }
        }
        switch(rType){ //根据rType的不同，相应处理总榜、好友、每日三张榜单
            case this.parent.const.RankType.friend:
                break;
            case this.parent.const.RankType.daily:
                if(this.dailyRankTop != rankData.slice(0,3)){//前三排名有变化，系统公告
                    this.dailyRankTop = [];
                    this.dailyRankTop = rankData.slice(0,3);
                    if(!!this.dailyRankTop[0])this.parent.service.chat.Record({id:7,c:"1",name:this.dailyRankTop[0].name,system:1});
                    if(!!this.dailyRankTop[1])this.parent.service.chat.Record({id:8,c:"1",name:this.dailyRankTop[1].name,system:1});
                    if(!!this.dailyRankTop[2])this.parent.service.chat.Record({id:9,c:"1",name:this.dailyRankTop[2].name,system:1});
                }
                break;
            case this.parent.const.RankType.total:
            default:
                if(this.g_rankTop != rankData.slice(0,3)){//前三排名有变化，系统公告
                    this.g_rankTop = [];
                    this.g_rankTop = rankData.slice(0,3);
                    if(!!this.g_rankTop[0])this.parent.service.chat.Record({id:4,c:"1",name:this.g_rankTop[0].name,system:1});
                    if(!!this.g_rankTop[1])this.parent.service.chat.Record({id:5,c:"1",name:this.g_rankTop[1].name,system:1});
                    if(!!this.g_rankTop[2])this.parent.service.chat.Record({id:6,c:"1",name:this.g_rankTop[2].name,system:1});
                }
                break;
        }
    }
}
exports = module.exports = rank;