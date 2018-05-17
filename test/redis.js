let expect = require('chai').expect; //断言库
let util = require('util');
let Cache = require('../util/cache');
let cm = new Cache(null);
let {RedisOperFlag} = require('../const/comm');

describe('redis', ()=>{
    it('KV操作：写入单个键值、读取并打印', done => {
        async function ts(){
            await cm.set('bookman', 100, RedisOperFlag.Promisify);
            console.log(await cm.get('bookman'));
            done();
        }

        ts().catch(e=>{
            console.error(e);
            done();
        });
    });

    it('KV操作：写入多个键值、读取并打印', done => {
        async function ts(){
            await cm.setAll([{key:'bookman1', value:100},{key:'bookman2', value:200},{key:'bookman3', value:300}]);
            console.log(await cm.get(['bookman1','bookman2','bookman3']));
            await cm.del(['bookman1','bookman2','bookman3']);
            done();
        }

        ts().catch(e=>{
            console.error(e);
            done();
        });
    });

    it('操作MAP：创建Map，添加多个条目，查询列表，批量删除', done => {
        //下面的结构可以作为通用异步调用的模板
        (async function t(){
            await cm.mapSet('bookman', {
                'no.1': 'bianque', 
                'no.2': 'baobao', 
                'no.3': 'athena'
            });

            let list = await cm.mapKeys('bookman');
            console.log(list);
            for(let key of list){
                console.log(key, await cm.mapGet('bookman', key));
            }
            console.log(await cm.mapValues('bookman'));
            await cm.mapDel('bookman', list);
            
            done();
        })();
    });

    it('操作集合：创建集合，添加多个条目，判断元素是否存在，查询集合元素，删除指定元素', done => {
        //下面的结构可以作为通用异步调用的模板
        (async function t(){
            //向名为language的集合中，添加元素，每次添加一个
            await cm.groupAdd('act', 'javascript');
            await cm.groupAdd('act', 'java');
            await cm.groupAdd('act', 'php');
            await cm.groupAdd('act', 'csharp');
            await cm.groupAdd('act', 'c++');
            await cm.groupAdd('act', 'delphi');
            
            //从名为language的集合中，删除元素，每次删除一个
            await cm.groupDel('act', 'java');

            //判断指定元素是否存在于名为language的集合中
            console.log(await cm.groupHas('act', 'java'));

            //获取集合中所有元素，联合groupDel一起使用，可删除集合中全部元素（可在活动结束，或者新活动开启时，清理上一期活动的残留数据）
            try{
                let list = await cm.groupKeys('act');
                console.log(list);
                cm.groupDel('act', list);
            }
            catch(e){
                console.error(e);
            }
            
            done();
        })();
    });
});