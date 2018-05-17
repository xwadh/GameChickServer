let {UserStatus, DomainType, CommMode, NotifyType, BonusType, ReturnCode, PurchaseStatus} = require('../const/comm');
let baseCtl = require('../facade/baseCtl');
//  md5加密
let {sign} = require('../util/commonFunc');

class shop extends baseCtl
{
    /**
     * 游戏大厅购物流程：客户端购买指定商品，按TX现有流程，将返回客户端一些准备参数，之后客户端提交到TX，TX反向调用服务端，服务端校验通过后，调用 CommitTrade 函数向用户发放商品，并下行通知
     * @param pUser
     * @param objData
     * @returns {{code: number, data: {tradeNo: string}}}
     */
    async BuyItem(pUser, objData){
        // 商城内商品的数据结构：
        // "id"			        : 1,
        // "type"			    : "A",
        // "itemId"		        : 0,
        // "pic"			    : "ui/shop/tilitubiao01",
        // "desc"			    : "10点体力",
        // "num"			    : 10,
        // "price"			    : 6,
        // "isSelling"		    : false,
        // "isCostEffective"    : false,
        // "isShowInShop"	    : true,
        // "itemTag"		    : "com.bigbulluniverse.crazy.diamond1"
        // End

        //针对不同平台，进行分支处理：
        switch(pUser.domainType){
            case DomainType.MF:
                break;

            case DomainType.D360: {
                let item = this.parent.config.fileMap.DataShop[objData.itemid];
                if(!item){
                    return {code:ReturnCode.illegalData};
                }

                try{
                    let result = await this.parent.service.log.PushBuyLog(pUser.domainType, pUser.openid, item.itemTag, item.price, (new Date()).valueOf(), item.desc, 1);
                    this.parent.service.log.setTrade(result);

                    let pay_data = {
                        'game_key': this.parent.sysCur[pUser.domainType]["game_key"],
                        'game_name': this.parent.sysCur["game_name"],
                        'plat_user_id': pUser.openid,
                        'amount': item.price,
                        'product_name': item.desc,
                        'notify_url': `${this.parent.sysCur.UrlHead}://${this.parent.sysCur.webserver.host}:${this.parent.sysCur.webserver.port}/pay360.html`,
                        'order_id': result.trade_no,
                        'timestamp': result.notify_time,
                    };
                    pay_data['sign'] = sign(pay_data, this.parent.sysCur[pUser.domainType]["game_secret"]);

                    return {code:ReturnCode.Success, data: pay_data};
                }
                catch(e){
                    return {code:ReturnCode.dbError};
                }
            }

            case DomainType.TX: { //玩吧
                try{
                    let item = this.parent.config.fileMap.shopOuter[objData.itemid];
                    if(!item){
                        return {code:ReturnCode.illegalData};
                    }

                    let rmRet = {code:0};
                    if(!this.parent.sysCur.debug){
                        rmRet = await this.parent.service.txApi.buy_playzone_item(
                            pUser.openid,
                            pUser.GetOpenKey(),
                            pUser.GetPf(),
                            objData.userip,
                            item.zoneid,
                            this.parent.sysCur.tx.appid,
                            item.itemid,
                            objData.count);
                    }

                    if(rmRet.code == 0){
                        let result = await this.parent.service.log.PushBuyLog(`${pUser.domain}`, pUser.openid, JSON.stringify(pUser.convertBonus(item.bonus)), item.price, (new Date()).valueOf(), "", 1);
                        this.parent.service.log.setTrade(result);
                        let pay_data = {
                            'game_key': "",
                            'game_name': this.parent.sysCur["game_name"],
                            'plat_user_id': pUser.openid,
                            'amount': item.price,
                            'product_name': item.desc,
                            'notify_url': `${this.parent.sysCur.UrlHead}://${this.parent.sysCur.webserver.host}:${this.parent.sysCur.webserver.port}/txpay.html`,
                            'order_id': result.trade_no,
                            'timestamp': result.notify_time,
                        };
                        let sign = this.parent.sysCur["game_secret"];
                        pay_data['sign'] = sign;

                        let ret = this.CommitTrade(pUser.openid, result.trade_no, item.price);
                        if(ret == this.parent.const.ReturnCode.Success){
                            // if(Date.parse(new Date()) < Date.parse(new Date("October 9,2017 0:0:0")) || Date.parse(new Date()) >= Date.parse(new Date("October 1,2017 0:0:0"))){
                                pUser.baseMgr.task.Execute(this.parent.const.em_Condition_Type.totalPurchase, item.price/10, this.parent.const.em_Condition_Checkmode.add);
                            // }
                            this.parent.notifyEvent('user.afterPurchase', {user:pUser, amount:item.price});
                            let now = Date.parse(new Date())/1000;
                            let tm1 = item.times.split(",");
                            if(now >= parseInt(tm1[0]) && now <= parseInt(tm1[1])){
                                if(!!item.extra){
                                    let extra = pUser.convertBonus(item.extra);
                                    pUser.getBonus(extra);
                                }
                            }
                            return {code:ReturnCode.Success, data: {total:pUser.baseMgr.info.GetRes(BonusType.Money), bonus:item.bonus}};
                        }
                        else{
                            return {code:ReturnCode.illegalData};
                        }
                    }
                    else{
                        console.log(`buy_playzone_item Error: ${JSON.stringify(rmRet)}`);
                        return {code:ReturnCode.authThirdPartFailed, data: rmRet};
                    }
                }
                catch(e){
                    console.log(e);
                    return {code:ReturnCode.dbError};
                }
            }

            case DomainType.TXX: {//空间
                try{
                    let item = this.parent.config.fileMap.DataShop[objData.itemid];
                    if(!item){
                        return {code:ReturnCode.illegalData};
                    }

                    let result = await this.parent.service.log.PushBuyLog(`${pUser.domain}`, pUser.openid, item.itemTag, item.price, (new Date()).valueOf(), item.desc, 1);
                    this.parent.service.log.setTrade(result);

                    let pay_data = {
                        'game_key': "",
                        'game_name': this.parent.sysCur["game_name"],
                        'plat_user_id': pUser.openid,
                        'amount': item.price,
                        'product_name': item.desc,
                        'notify_url': `${this.parent.sysCur.UrlHead}://${this.parent.sysCur.webserver.host}:${this.parent.sysCur.webserver.port}/txpay.html`,
                        'order_id': result.trade_no,
                        'timestamp': result.notify_time,
                    };

                    let sign = this.parent.sysCur["game_secret"];
                    pay_data['sign'] = sign;

                    return {code:ReturnCode.Success, data: pay_data};
                }
                catch(e){
                    return {code:ReturnCode.dbError};
                }
            }
        }
        return {code:ReturnCode.Error};
    }

    /**
     * 游戏大厅购物流程：第三方平台回调时，我方平台确认交易完成
     * @param uuid             用户UUID(不带域名)
     * @param tradeNo			订单流水号
     * @param total_fee		总金额
     * @returns {*}
     */
    CommitTrade(uuid, tradeNo, total_fee) {
        let item = this.parent.service.log.getTrade(tradeNo);
        if (!item || item.uuid != uuid || item.trade_no != tradeNo || item.total_fee != total_fee || item.result == PurchaseStatus.cancel) {
            console.log('[trade not exist]');
            return ReturnCode.illegalData;
        }

        if(item.result == PurchaseStatus.commit){ //已经处理完毕的重复订单, 直接返回
            return ReturnCode.Success;
        }

        let pUser = this.parent.service.users.GetUserByDomainId(`${item.domain}.${uuid}`);
        if(!pUser){
            return ReturnCode.userIllegal;
        }

        //设置首充标记,单笔金额必须大于等于60
        if(total_fee >= 60){
            if(!pUser.baseMgr.info.CheckStatus(UserStatus.isFirstPurchase)){
                pUser.baseMgr.info.SetStatus(UserStatus.isFirstPurchase);
                pUser.baseMgr.info.UnsetStatus(UserStatus.isFirstPurchaseBonus);
            }
        }

        //给 user 道具
        pUser.getBonus(item.product_id);
        item.result = PurchaseStatus.commit;
        item.save();

        //向客户端下行购买成功通知
        pUser.notify({type: NotifyType.buyItem, info:{tradeNo:item.trade_no, product_id: item.product_id}});

        return ReturnCode.Success;
    }
}
exports = module.exports = shop;
