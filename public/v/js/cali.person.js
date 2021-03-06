$(document).ready(function(){
    // 定义名为 userdiv 的新组件
    Vue.component('usersdiv', {
        // bookinfodiv 组件现在接受一个
        // 这个属性名为 book。
        props: ['userlist'],
        template: '\
        <table class="table">\
            <thead>\
                <tr>\
                    <th>#</th>\
                    <th>#</th>\
                    <th>#</th>\
                    <th>#</th>\
                </tr>\
            </thead>\
            <tbody>\
                <tr v-for="item in userlist">\
                    <td v-text="item.userName"></td>\
                    <td v-text="item.loginName"></td>\
                    <td v-text="item.email"></td>\
                    <td><a class="btn btn-danger" @click="deleteuser" :id="item.id">delete</a></td>\
                </tr>\
            </tbody>\
        </table>\
        ',
        methods:{
            deleteuser:function (t) {
                var form = commonData();
                form.set("userId",t.target.id);
                fetch('/api/user/delete',{method:'post',body:form}).then(function(response) {
                    if (response.redirected){
                        var tmpJson = {};
                        tmpJson.statusCode = 500;
                        return tmpJson;
                    }
                    return response.json();
                }).then(function(json) {
                    if (json.statusCode ==200){
                        //refresh this page
                        $('#userlistpage').pagination($('#userlistpage').pagination('getSelectedPageNum'))
                    }else {
                    }
                }).
                catch(function(ex) {
                    console.log('parsing failed', ex)
                });
            }
        }
    });


    var app = new Vue({
        i18n,
        el: "#root",
        data: {
            session:"",
            user:{},
            discover:"",
            listseen:{},
            changeuserinfotipinfo:"",

            //change password
            oldLoginPassword:"",
            loginPassword:"",
            repeatLoginPassword:"",
            changepasswordtipinfo:"",

            //userlist
            userlistseen:false,
            userlist:[]
        },
        methods: {
            changeseen:function (e) {
                this.listseen = {};
                this.listseen["discover"] = false;
                this.listseen["userlist"] = false;
                this.listseen["upload"] = false;
                this.listseen["changeuserinfo"] = false;
                this.listseen["changepassword"] = false;
                this.listseen[e] = true;
            },
            markdown2html: function (m) {
                showdown.setOption('simpleLineBreaks', true);
                //showdown.setOption('\n', '<br/>');
                var converter = new showdown.Converter();
                var html      = converter.makeHtml(m);
                return html;
            },
            uploadfile:function () {
                var file = document.getElementById("book").value;
                if (file == null || (file.match(/.epub$/g)==null && file.match(/.mobi$/g)==null)){
                    alert("please open file or choose .epub/.mobi");
                    return;
                }
                alert("please wait...");
                var form = new FormData(document.getElementById("uploadfile"));
                form.set('session',commonData().get('session'));
                fetch("/api/book/uploadbook", {
                    method: "post",
                    body: form
                }).then(function(response) {
                    if (response.redirected){
                        alert("role action setting error !");
                        return;
                    }
                    return response.json();
                }).then(function(json) {
                    if (json.statusCode ==200){
                        alert(json.info);
                    }else {
                        alert("upload error "+json.info);
                    }
                }).
                catch(function(ex) {
                    console.log('parsing failed', ex)
                });
            },
            changeuserinfo:function () {
                if (app.user.userName == null || app.user.userName=="" || app.user.email == null || app.user.email==""){
                    app.changeuserinfotipinfo = "lang.notnull";
                    return;
                }else {
                    app.changeuserinfotipinfo = "";
                    var form = commonData();
                    form.set("userName",app.user.userName);
                    form.set("email",app.user.email);
                    fetch('/api/user/update',{method:'post',body:form}).then(function(response) {
                        if (response.redirected){
                            alert("role action setting error !");
                            return;
                        }
                        return response.json();
                    }).then(function(json) {
                        if (json.statusCode ==200){
                            fetch('/api/user/info',{method:'post',body:commonData()}).then(function(response) {
                                return response.json();
                            }).then(function(user) {
                                if (user.statusCode ==200){
                                    store.set("user", user.info);
                                    alert("update success");
                                    window.location = "/public/v/person.html"
                                }else {
                                    alert("密码错误:"+user.message);
                                }
                            }).
                            catch(function(ex) {
                                console.log('parsing failed', ex)
                            });
                        }else {
                            alert("update error "+json.info);
                        }
                    }).
                    catch(function(ex) {
                        console.log('parsing failed', ex)
                    });
                }
            },
            checkchangepassword:function () {
                if (app.oldPassword=="" || app.loginPassword==""){
                    app.changepasswordtipinfo = "lang.notnull";
                    return ;
                }
                if(app.loginPassword!=app.repeatLoginPassword){
                    app.changepasswordtipinfo = "lang.pcp";
                    return ;
                }
                app.changepasswordtipinfo = "";
                return;
            },
            changepassword:function () {
                if (app.changepasswordtipinfo != ""){
                    return;
                }
                var form = commonData();
                form.set("oldLoginPassword",app.oldLoginPassword);
                form.set("loginPassword",app.loginPassword);
                fetch('/api/user/changepassword',{method:'post',body:form}).then(function(response) {
                    return response.json();
                }).then(function(json) {
                    if (json.statusCode ==200){
                        store.remove("user");
                        store.remove("session");
                        alert("update success");
                        window.location = "/public/v/login.html"
                    }else {
                        alert("密码错误:"+json.message);
                    }
                }).
                catch(function(ex) {
                    console.log('parsing failed', ex)
                });

            }
        },
        computed: {
            computed_discover:function () {
                showdown.setOption('simpleLineBreaks', true);
                //showdown.setOption('\n', '<br/>');
                var converter = new showdown.Converter();
                var html      = converter.makeHtml(this.discover);
                return html;
            },
            userlist_computed : function () {
                return this.userlist;
            }
        },
        created: function() {
            //console.log("created");
            if (_.isUndefined(store.get("session")) || _.isUndefined(store.get("user"))){
                window.location = "/public/v/login.html";
            }
            this.session = store.get('session');
            this.user = store.get('user');

            //https://raw.githubusercontent.com/jiangmitiao/cali/master/README.md
            var url = "";
            if (get_language()=="zh-CN"){
                url = "https://raw.githubusercontent.com/jiangmitiao/cali/master/README_CN.md";
            }else {
                url = "https://raw.githubusercontent.com/jiangmitiao/cali/master/README.md";
            }
            fetch(url).then(function(response) {
                return response.text();
            }).then(function(text) {
                app.discover = text;
            }).catch(function(ex) {
                console.log('parsing failed', ex)
            });

            fetch('/api/user/queryusercount',{method:'post',body:commonData()}).then(function(response) {
                if (response.redirected){
                    app.userlistseen = false;
                    var tmpJson = {};
                    tmpJson.statusCode = 500;
                    return tmpJson;
                }
                return response.json();
            }).then(function(json) {
                if (json.statusCode ==200){
                    $('#userlistpage').pagination({
                        dataSource:function (done) {
                            var tmp = [];
                            for(var i=0; i<json.info;i++){
                                tmp.push(i)
                            }
                            return done(tmp);
                        },
                        pageRange:1,
                        totalNumber:json.info,
                        pageSize: 8,
                        showGoInput: true,
                        showGoButton: true,
                        callback: function(data, pagination) {
                            var form = commonData();
                            form.set("start",_.min(data));
                            form.set("limit",data.length);
                            fetch('/api/user/queryuser',{method:'post',body:form}).then(function(response) {
                                if (response.redirected){
                                    app.userlistseen = false;
                                    var tmpJson = {};
                                    tmpJson.statusCode = 500;
                                    return tmpJson;
                                }
                                return response.json();
                            }).then(function(json) {
                                if (json.statusCode ==200){
                                    app.userlistseen = true;
                                    app.userlist = json.info
                                }
                            }).
                            catch(function(ex) {
                                console.log('parsing failed', ex)
                            });
                        }
                    });
                }
            }).
            catch(function(ex) {
                console.log('parsing failed', ex)
            });
        },
        beforeMount: function () {
            //console.log("beforeMount");
            this.listseen = {};
            this.listseen["discover"] = true;
            this.listseen["userlist"] = false;
            this.listseen["upload"] = false;
            this.listseen["changeuserinfo"] = false;
            this.listseen["changepassword"] = false;
        },
        mounted: function () {
            //console.log("mounted");
        }
    });
});