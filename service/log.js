let {BuyLog} = require('../model/BuyLog');

/**
 * 日志管理
 */
class log
{
    constructor(parent){
        this.parent = parent;
        this.tradeList = {};
    }

    /**
     * 加载全部订单
     * @returns {Promise.<void>}
     */
    async loadAll(){
        try{
            let ret = await BuyLog().findAll({ });
            ret.map(it=>{
                this.tradeList[it.trade_no] = it;                        //添加到字典
            });
       }
       catch(e){
       }
    }

    /**
     * 获取已确认订单总额
     */
    get amount(){
        return Object.keys(this.tradeList).reduce((sofar, cur)=>{
            if(this.tradeList[cur].result == this.parent.const.PurchaseStatus.commit){
                sofar += parseInt(this.tradeList[cur].total_fee);
            }
            return sofar;
        }, 0);
    }

    PushBuyLog(domain, uuid, product_id, total_fee, notify_time, product_name, request_count){
        return BuyLog().create({
            'domain':domain,
            'uuid':uuid,
            'product_id': (product_id.constructor == String ? product_id : JSON.stringify(product_id)),
            'total_fee':total_fee,
            'notify_time':notify_time,
            'product_name':product_name,
            'request_count':request_count,
            'result': this.parent.const.PurchaseStatus.create,
        });
    };

    getTrade (tradeNo){
        return this.tradeList[tradeNo];
    }

    setTrade (result){
        result.trade_no = `BX${result.domain}${result.id}`;
        result.save();
        this.tradeList[result.trade_no] = result;
    }
}

exports = module.exports = log;
