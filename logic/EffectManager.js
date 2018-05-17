/**
 * Created by liub on 2017-04-07.
 */
let EffectObject = require('./EffectObject');
let {em_EffectCalcType,em_Effect_Comm,mapOfTechCalcType} = require('../const/comm');

/**
 * 技能特效管理器
 */
class EffectManager
{
    constructor($val){
        this.effectList = !!$val ? $val : {};
        this.isEffectChanged = true; //是否脏数据. 对象初创时总是为真
    }

    /**
     * 清空全部现有效果
     */
    Clear() {
        this.effectList = {};
        this.isEffectChanged = true;
        return this;
    }

    /**
     * 叠加其他特权管理器, 支持链式操作
     * @param $em
     */
    Add($em){
        if($em.constructor == String){
            $em.split(';').map(item=>{
                let _eff = item.split(',');
                if(_eff.length >= 2){
                    this.AddItem(new EffectObject(parseInt(_eff[0]), parseFloat(_eff[1])));
                }
            });
        }
        else{
            Object.keys($em.effectList).map(key=>{
                if (!this.effectList[key]) {//之前不存在该种特权
                    this.effectList[key] = $em.effectList[key];
                } else {
                    this.effectList[key].Add($em.effectList[key]);
                }
            });
        }
        this.SetEffectChanged();
        return this;
    }

    /**
     * 传入特权类型、特权初始值, 累计所有特权加持效果，得到加持后的特权最终值
     * @param $_effect
     * @param $oriValue
     * @return float
     */
    CalcFinallyValue($_effect, $oriValue)
    {
        if (!mapOfTechCalcType[$_effect] || !this.effectList[$_effect]) {
            return $oriValue;
        }

        let $ct = mapOfTechCalcType[$_effect];
        switch ($ct) {
            case em_EffectCalcType.em_EffectCalc_Multiplication:
                return $oriValue * (1 + this.effectList[$_effect].value);
            case em_EffectCalcType.em_EffectCalc_Addition:
                return $oriValue + this.effectList[$_effect].value;
            case em_EffectCalcType.em_EffectCalc_Subduction:
                return $oriValue - this.effectList[$_effect].value;
            case em_EffectCalcType.em_EffectCalc_Division:
                return (1 - this.effectList[$_effect].value) * $oriValue;
        }
        return $oriValue;
    }

    /**
     * 获取脏数据标志
     * @return bool
     */
    GetEffectChanged()    {
        return this.isEffectChanged;
    }

    /**
     * 设置脏数据标志 返回自身
     * @param $c
     * @return this
     */
    SetEffectChanged($c = true)
    {
        this.isEffectChanged = $c;
        return this;
    }

    /**
     * 叠加单个特权效果对象 支持链式操作
     * @param $eo
     * @return this
     */
    AddItem($eo)
    {
        if (!this.effectList[$eo.type]) {
            this.effectList[$eo.type] = $eo;
        } else {
            this.effectList[$eo.type].Add($eo);
        }
        //设置变化标志，以便上级效果器能够感知
        this.SetEffectChanged();
        return this;
    }

    /**
     * 对所有特权做比率变化
     * @param $_rate 准备变化的比率值
     * @return $this
     */
    Multi($_rate)
    {
        Object.keys(this.effectList).map(key=>{
            this.effectList[key].value *= $_rate;

        });
        this.SetEffectChanged();
        return this;
    }
}

exports = module.exports = EffectManager;
