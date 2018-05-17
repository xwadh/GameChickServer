let baseMgr = require('../facade/baseMgr');
let {NotifyType,ActivityType, BonusType, ReturnCode} = require('../const/comm');
let config = require('../util/configInterface');  //配置文件管理

let upgradeChip = {1: Math.ceil(config.fileMap.constdata.getRoleNum.num)};
for(let j = 2; j <= 30; j++){
    upgradeChip[j] = upgradeChip[1];
    for(let i = 2; i <= j; i++){
        upgradeChip[j] = Math.ceil(upgradeChip[j] + config.fileMap.constdata.debrisConumRate.num * (i-1));
    }
}

class item extends baseMgr
{
    constructor(parent){
        super(parent, 'item');
        this.v = {};
    }
    /**
     * 设置角色技能
     */
    setSkill(cur){
        //todo:判断技能
        let role = this.parent.router.config.fileMap.roledata[cur];
        if(!this.v[cur].sk && this.v[cur].sk != 0){
            this.v[cur].sk = 0;
        }
        if (Math.floor(this.v[cur].sk / 10000) == 0) {
            if (role.unlockskill1.length == 0) {
                this.v[cur].sk += 10000;
            }
            else {
                let allow = 1;
                for (let i = 0; i < role.unlockskill1.length; i++) {
                    if (this.v[role.unlockskill1[i]]) {
                        allow = allow & 1;
                    }
                    else {
                        allow = allow & 0;
                    }
                }
                if (allow == 1) {
                    this.v[cur].sk += 10000;
                }
            }
        }

        if (Math.floor((this.v[cur].sk % 10000) / 100) == 0) {
            if (role.unlockskill2.length == 0) {
                this.v[cur].sk += 100;
            }
            else {
                let allow = 1;
                for (let i = 0; i < role.unlockskill2.length; i++) {
                    if (this.v[role.unlockskill2[i]]) {
                        allow = allow & 1;
                    }
                    else {
                        allow = allow & 0;
                    }
                }
                if (allow == 1) {
                    this.v[cur].sk += 100;
                }
            }
        }

        if (Math.floor(this.v[cur].sk % 100) == 0) {
            if (role.unlockskill3.length == 0) {
                this.v[cur].sk += 1;
            }
            else {
                let allow = 1;
                for (let i = 0; i < role.unlockskill3.length; i++) {
                    if (this.v[role.unlockskill3[i]]) {
                        allow = allow & 1;
                    }
                    else {
                        allow = allow & 0;
                    }
                }
                if (allow == 1) {
                    this.v[cur].sk += 1;
                }
            }
        }
        
    }
    
    /**
     * 检测技能解锁
     * @param 角色id——判断该角色可解锁的技能
     */
    checkSkill(id){
        return Object.keys(this.v).reduce((sofar, cur)=>{
            if((cur/1000|0) == 1){ //判断是否是角色
                if(!this.v[cur].lv){
                    this.v[cur].lv = 1;
                }
                this.setSkill(cur);
                let role = this.parent.router.config.fileMap.roledata[cur];
                                
                for(let i = 0; i < role.unlockskill1.length; i++){
                
                    if(role.unlockskill1[i] == id && Math.floor(this.v[cur].sk/10000) != 0){
                        sofar.push({id:cur, lv:this.v[  cur].lv, 
                                    sk1: Math.floor(this.v[cur].sk/10000),
                                    sk2: Math.floor((this.v[cur].sk%10000)/100),
                                    sk3: Math.floor(this.v[cur].sk%100)});
                    }
                }
                for(let j = 0; j < role.unlockskill2.length; j++){
                
                    if(role.unlockskill2[j] == id && Math.floor((this.v[cur].sk%10000)/100) != 0){
                        sofar.push({id:cur, lv:this.v[cur].lv, 
                            sk1: Math.floor(this.v[cur].sk/10000),
                            sk2: Math.floor((this.v[cur].sk%10000)/100),
                            sk3: Math.floor(this.v[cur].sk%100)});
                    }
                }
                for(let k = 0; k < role.unlockskill3.length; k++){
                
                    if(role.unlockskill3[k] == id && Math.floor(this.v[cur].sk%100) != 0){
                        sofar.push({id:cur, lv:this.v[cur].lv, 
                            sk1: Math.floor(this.v[cur].sk/10000),
                            sk2: Math.floor((this.v[cur].sk%10000)/100),
                            sk3: Math.floor(this.v[cur].sk%100)});
                    }
                }
            }
            return sofar;
        }, []);
    }
    /**
     * 角色分享
     * @param id 角色id
     * @param choose 是否选择分享
     */
    roleShare(id,choose = 0){
        if(!this.v[id]){
            return {code:ReturnCode.illegalData};
        }
        if(choose != 0){
            let bonus = [{type:BonusType.Diamond, num:50}];
            this.parent.getBonus(bonus);
            this.parent.notify({type: NotifyType.roleShare, info: {bonus:bonus}});
        }
        return {code:ReturnCode.Success};
    }
    /**
     * 能否解锁角色关联场景
     * 目前只有火影场景 2017.9.25
     * @param sceneid: "1" 火影场景
     */
    unlockedScene(sceneid = "1"){
        if(!this.parent.baseMgr.info.CheckStatus(this.parent.router.const.UserStatus.unlockedNinjaScene)){
            if(this.v[1031] && this.v[1032] && this.v[1033]){
                this.parent.baseMgr.info.SetStatus(this.parent.router.const.UserStatus.unlockedNinjaScene);
                return {code:ReturnCode.Success};
            }
            else{
                return {code:ReturnCode.taskNotFinished};
            }
        }
        else{
            return {code:ReturnCode.taskBonusHasGot};
        }
        
    }


    /**
     * 获取角色列表，包含等级信息
     * @returns {*}
     */
    getRoleList(){
        return Object.keys(this.v).reduce((sofar, cur)=>{
            if((cur/1000|0) == 1){ //判断是否是角色
                if(!this.v[cur].lv){
                    this.v[cur].lv = 1;
                }
                this.setSkill(cur);
                sofar.push({id:cur, lv:this.v[cur].lv, sk1:Math.floor(this.v[cur].sk/10000), sk2:Math.floor((this.v[cur].sk%10000)/100), sk3:Math.floor(this.v[cur].sk%100)});
            }
            return sofar;
        }, []);
    }

    /**
     * 升级角色技能
     * @param id 角色id
     * @param skid 技能id
     * @param price 技能升级价格
     */
    upgradeSkill(id,skid,price){
        let role = this.parent.router.config.fileMap.roledata[id];
        if(!role || (skid != 1 && skid != 2 && skid != 3)){
            return {code: ReturnCode.illegalData};
        }
        if(!this.v[id].sk){
           this.setSkill(id);
        }
        //判断金币数值是否合法
        let base = this.parent.router.config.fileMap.constdata.skillMoneyBase.num;
        let current = 0;
        if(skid == 1){
            current = Math.ceil(base * Math.pow(Math.floor(this.v[id].sk/10000),1.6));
        }
        else if(skid == 2){
            current = Math.ceil(base * Math.pow(Math.floor((this.v[id].sk%10000)/100),1.6));
        }
        else{
            current = Math.ceil(base * Math.pow( Math.floor(this.v[id].sk%100),1.6));
        }
        if(price == current){
            // if(this.parent.router.sysCur.debug){
            //     price = 0;
            // }
            //判断用户金币储量以及升级技能所需关联角色等级            
            if(this.parent.baseMgr.info.GetRes(BonusType.Money) >=price){
                this.parent.baseMgr.info.SubRes(BonusType.Money,price);
                if(skid == 1){
                    if(role.unlockskill1.length == 0){
                        if(this.v[id].lv > Math.floor(this.v[id].sk/10000)){
                            this.v[id].sk += 10000;
                        }
                        else {
                            return {code: ReturnCode.RoleLeveltooLow};
                        }
                    }
                    else{
                        let allow = 1;
                        for(let i = 0; i < role.unlockskill1.length; i++){
                                if(this.v[role.unlockskill1[i]].lv > Math.floor(this.v[id].sk/10000)){
                                    allow = allow&1;
                                }
                                else {
                                    allow = allow&0;
                                }
                        }
                        if(allow == 1){
                            this.v[id].sk += 10000;
                        }
                        else {
                            return {code: ReturnCode.RoleLeveltooLow};
                        }
                    }
                }
                else if(skid == 2){
                    if(role.unlockskill2.length == 0){
                        if(this.v[id].lv > Math.floor((this.v[id].sk%10000)/100)){
                            this.v[id].sk += 100;
                        }
                        else {
                            return {code: ReturnCode.RoleLeveltooLow};
                        }
                    }
                    else{
                        let allow = 1;
                        for(let i = 0; i < role.unlockskill2.length; i++){
                                if(this.v[role.unlockskill2[i]].lv > Math.floor((this.v[id].sk%10000)/100)){
                                    allow = allow&1;
                                }
                                else {
                                    allow = allow&0;
                                }
                        }
                        if(allow == 1){
                            this.v[id].sk += 100;
                        }
                        else {
                            return {code: ReturnCode.RoleLeveltooLow};
                        }
                    }
                }
                else{
                    if(role.unlockskill3.length == 0){
                        if(this.v[id].lv > Math.floor(this.v[id].sk%100)){
                            this.v[id].sk += 1;
                        }
                        else {
                            return {code: ReturnCode.RoleLeveltooLow};
                        }
                    }
                    else{
                        let allow = 1;
                        for(let i = 0; i < role.unlockskill3.length; i++){
                                if(this.v[role.unlockskill3[i]].lv > Math.floor(this.v[id].sk%100)){
                                    allow = allow&1;
                                }
                                else {
                                    allow = allow&0;
                                }
                        }
                        if(allow == 1){
                            this.v[id].sk += 1;
                        }
                        else {
                            return {code: ReturnCode.RoleLeveltooLow};
                        }
                    }
                    
                }
                return{code:ReturnCode.Success,data:{id:id,sk1: Math.floor(this.v[id].sk/10000),sk2: Math.floor((this.v[id].sk%10000)/100),sk3: Math.floor(this.v[id].sk%100),}};
            }
            else{
                return {code:ReturnCode.MoneyNotEnough};
            }
        }
        else{
            return {code: ReturnCode.illegalData};
        }
    }

    /**
     * 升级角色
     * @param id
     */
    upgradeRole(id){
        let role = this.parent.router.config.fileMap.roledata[id];     
        if(!role){
            return {code: ReturnCode.illegalData};
        }
        let chipId = role.pieceid;

        let it = this.parent.baseMgr.item.getItem(id);
        if(!it){
            it = {num:1, lv:0 ,sk:0}; //不存在的角色，准备执行激活操作
        }

        //碎片数量 = 当前等级所需数量 + 碎片成长系数 x (当前等级-1)，其中，碎片成长系数默认为0.2，配在常量表中
        if(!upgradeChip[it.lv+1]){
            return {code: ReturnCode.roleMaxLevel};
        }

        let cnum = upgradeChip[it.lv+1];
        if(!this.v[chipId] || this.v[chipId].num < cnum){
            return {code: ReturnCode.roleChipNotEnough};
        }

        this.useItem(chipId, cnum);
        let data = [];
        if(!this.v[id] || !this.v[id].lv){
            //判断角色技能解锁情况
            this.v[id] = {num:1, lv:1, sk:0};
            this.setSkill(id);
            data = this.checkSkill(id);
        }
        else{
            this.v[id].lv += 1;
        }     
        return {code: ReturnCode.Success,
                data:{
                    id: id,
                    lv: this.v[id].lv,
                    chip: !!this.v[chipId] ? this.v[chipId].num : 0,
                    sk1: Math.floor(this.v[id].sk/10000),
                    sk2: Math.floor((this.v[id].sk%10000)/100),
                    sk3: Math.floor(this.v[id].sk%100),
                    unlock: data
                    }
                };
    }

    /**
     * 获取背包列表
     * @returns {{}|*}
     */
    getList(){
        //对历史数据进行修改
        Object.keys(this.v).map(key=>{
            if(key == 2001){
                this.addItem(18, this.v[2001].num); //将2001转化为18
                delete this.v[2001];
            }
            else if(key == 2002){
                this.addItem(19, this.v[2002].num); //将4001转化为19
                delete this.v[2002];
            }
            else if(key == 4001){
                this.addItem(20, this.v[4001].num); //将4001转化为20
                delete this.v[4001];
            }
        });

        return this.v;
    }

    /**
     * 获取指定道具
     * @param id    道具编号
     * @param num   道具数量 默认为1
     */
    addItem(id, num=1){
        if(!id){//防止id非法
            return;
        }
        //限制最大值和最小值
        num = Math.min(100000, Math.max(0, num));

        if(num.constructor == String){
            num = parseInt(num);
        }

        if(!!this.v[id] && !!this.v[id].num){
            this.v[id].num += num;
        }
        else{
            this.v[id] = {num:num};
        }

        this.dirty = true;
        return {code: this.parent.router.const.ReturnCode.Success, data:{id:id, num:num}};
    }

    /**
     * 获取
     * @param id
     * @returns {*}
     */
    getItem(id){
        return this.v[id];
    }

    /**
     * 查询指定编号的道具，返回其详细属性
     * @param id 道具编号
     * @returns {boolean}
     */
    find(id){
        if(!!this.v[id]){
            return true;
        }
        return false;
    }

    /**
     * 判断给定奖励和指定类型是否相关
     */
    relation(bonus, $type, $ret = false){
        function $relation(_bonus, _type){
            switch(_type){
                case BonusType.Action:
                    //return _bonus.id == 22 || _bonus.id == 23;
                    return _bonus.id == 23; //目前满体力情况下能买矿泉水，但不能买咖啡机
                }
            return _bonus.type == _type;
        }

        if(bonus.constructor == String){
            let bo = this.parent.getBonus(JSON.parse(bonus));
            $ret = $ret || $relation(bo,$type);
        }
        else if(bonus.constructor == Array){
            bonus.map(item=>{
                $ret = $ret || $relation(item,$type);
            });
        }
        else{
            $ret = $ret || $relation(bonus,$type);
        }
        return $ret;
    }


    /**
     * 使用指定道具
     * @param id
     */
    useItem(id, num = 1){
        if(num.constructor == String){
            num = parseInt(num);
        }
        num = Math.min(110, !!num ? num : 1); //一次最多用110张

        if(!!this.v[id] && !!this.v[id].num  && this.v[id].num >= num){
            //region 任务检测 复活咖啡豆
            switch(id){
                case 22:
                    this.parent.baseMgr.info.AddRes(BonusType.Action, num, false);
                    break;
                case 23:
                    //如果体力满了就不要添加了
                    if(!this.parent.baseMgr.info.isMaxRes(BonusType.Action)){ 
                        this.parent.baseMgr.info.AddRes(BonusType.Action, this.parent.baseMgr.info.GetResMaxValue(BonusType.Action));
                    }
                    break;
                case 20:
                    this.parent.baseMgr.task.Execute(this.parent.router.const.em_Condition_Type.totalRevive, num, this.parent.router.const.em_Condition_Checkmode.add);
                    //增加战场的持续时间，避免战场提前超时
                    // this.parent.baseMgr.vip.addTime();

                    //累计分段积分
                    this.parent.router.service.activity.addScore(this.parent.id, ActivityType.Revive, 1);
                    break;
            }
            //endregion

            if(this.v[id].num > num){
                this.v[id].num -= num;
            }
            else{
                delete this.v[id];
            }
            this.dirty = true;

            return {code: this.parent.router.const.ReturnCode.Success, data:this.getList()};
        }
        else{
            return {code: this.parent.router.const.ReturnCode.itemNotExist};
        }
    }
}

exports = module.exports = item;
