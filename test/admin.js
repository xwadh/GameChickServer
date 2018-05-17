/**
 * 单元测试：后台管理
 * Creted by liub 2017.3.24
 */
let remote = require('../util/clientComm')();

describe.skip('后台管理', function() {
    /**
     * 一个单元测试，可使用 skip only 修饰
     * 和负载均衡相关的单元测试，首先连接9901端口，发送config.getServerInfo请求，携带 "stype":"IOS", "oemInfo":{"openid":'helloworl'} 等参数，返回值：data.newbie:是否新注册用户 data.ip:服务器IP, data.port:服务器端口号
     */
    it('登录'/*单元测试的标题*/, /*单元测试的函数体，书写测试流程*/done =>{
        remote.auth({domain:'admin', openid:'2222', openkey:'chick.server'}, msg => {
            done(); //通知系统：测试用例顺利完成
        });
    });

    it('注册/在线/消费'/*单元测试的标题*/, /*单元测试的函数体，书写测试流程*/done =>{
        remote.auth({domain:'admin', openid:'2222', openkey:'chick.server'}, msg => {
            remote.fetch({func:'admin.summary', server:'IOS.2'}, msg=>{
                remote.log(msg);
                done();
            });
        });
    });

    it('服务器列表', done =>{
        remote.auth({domain:'admin', openid:'2222', openkey:'chick.server'}, msg => {
            remote.fetch({func:'admin.getServerList'}, msg=>{
                remote.log(msg);
                done();
            });
        });
    });

    it('留存率'/*单元测试的标题*/, /*单元测试的函数体，书写测试流程*/done =>{
        remote.auth({domain:'admin', openid:'2222', openkey:'chick.server'}, msg => {
            remote.fetch({func:'admin.survive', time:'2017.5.29'}, msg=>{
                remote.isSuccess(msg);
                msg.data.map(it=>{
                    remote.log(it);
                })
                done();
            });
        });
    });

    it('列表特殊路由', done =>{
        remote.auth({domain:'admin', openid:'2222', openkey:'chick.server'}, msg => {
            remote.fetch({func:'admin.addRoute', openid:'111'}, msg=>{
                console.log(msg);
                remote.fetch({func:'admin.addRoute', openid:'222'}, msg=>{
                    console.log(msg);
                    remote.fetch({func:'admin.delRoute', openid:'111'}, msg=>{
                        console.log(msg);
                        done();
                    })
                })
            })
        });
    });
});
