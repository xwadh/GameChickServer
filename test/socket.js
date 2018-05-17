/**
 * Created by admin on 2017-06-27.
 */
let {CommMode, ReturnCode} = require('../const/comm');
let remote = require('../util/clientComm')(CommMode.socket);

describe.skip('原生Socket', function(){
    it('连接并收发报文', done=>{
        remote.auth().fetch({"func":"test.echo"}, ret=>{
            remote.log(ret);
            done();
        });
    });
});
