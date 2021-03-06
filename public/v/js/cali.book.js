$(document).ready(function(){
    //console.log("start");
    function UrlSearch(){
        var name,value;
        var str=location.href; //取得整个地址栏
        var num=str.indexOf("?");
        str=str.substr(num+1); //取得所有参数stringvar.substr(start [, length ]

        var arr=str.split("&"); //各个参数放到数组里
        for(var i=0;i < arr.length;i++){
            num=arr[i].indexOf("=");
            if(num>0){
                name=arr[i].substring(0,num);
                value=arr[i].substr(num+1);
                this[name]=value;
            }
        }
    }
    var Request=new UrlSearch(); //实例化

    // 定义名为 bookinfodiv 的新组件
    Vue.component('bookinfodiv', {
        // bookinfodiv 组件现在接受一个
        // 这个属性名为 book。
        props: ['book'],
        template: '\
        <div class="content-box-large">\
            <div class="panel-heading">\
                    <div class="panel-title"><span v-text="book.title"></span></div>\
            </div>\
            <div class="panel-body">\
                <div class="row">\
                    <div class="col-md-3 col-md-offset-1">\
                        <img width="100%" height="100%" :src="\'/book/bookimage?bookid=\'+book.id"/>\
                    </div>\
                    <div class="col-md-5">\
                        <p <span v-text="$t(\'lang.bookname\')"></span>: <span v-text="book.title"></span></p>\
                        <p><span v-text="$t(\'lang.bookauthor\')"></span>: <span v-text="book.name"></span></p>\
                        <p><span v-text="$t(\'lang.bookpublishtime\')"></span>: <span v-text="formatdate(book.pubdate)"></span></p>\
                        <p><span v-text="$t(\'lang.bookupdatetime\')"></span>: <span v-text="formatdate(book.timestamp)"></span></p>\
                        <p><span v-text="$t(\'lang.bookisbn\')"></span>: <span v-text="book.isbn"></span></p>\
                        <p><span v-text="$t(\'lang.bookmodifiedtime\')"></span>: <span v-text="formatdate(book.last_modified)"></span></p>\
                        <p><span v-text="$t(\'lang.bookrating\')"></span>: <span v-text="book.rating"></span></p>\
                        <p><span v-text="$t(\'lang.bookdownloadlink\')"></span>: <a :href="\'/book/bookdown?bookid=\'+book.id+withSession"><span v-text="$t(\'lang.download\')"></span></a></p>\
                        <p v-if="book.format==\'EPUB\'"><span v-text="$t(\'lang.read\')"></span>: <a :href="\'read.html?bookid=\'+book.id"><span v-text="$t(\'lang.read\')"></span></a></p>\
                        <p><span v-text="$t(\'lang.booksummary\')"></span>: <span v-html="markdown2html(book.comments)"></span></p>\
                    </div>\
                </div>\
            </div>\
        </div>\
        ',
        methods:{
            //format the data which from back to 'YYYY-MM-DD'
            formatdate:function (d) {
                return moment(new Date(d)).format("YYYY-MM-DD")
            },
            markdown2html: function (m) {
                showdown.setOption('simpleLineBreaks', true);
                //showdown.setOption('\n', '<br/>');
                var converter = new showdown.Converter();
                var html      = converter.makeHtml(m);
                return html;
            }
        },
        data:function () {
            return {
                withSession: function () {
                    if (_.isUndefined(store.get("session"))){
                        return "&session=ok";
                    }else {
                        return "&session="+store.get("session");
                    }
                }()
            };
        }
    });

    var app = new Vue({
        i18n,
        el: "#root",
        data: {
            // the only one book's info
            book:{},
            //if bookseen is true ,then display the book's div
            bookseen:false,
            //douban's book info
            doubanbook:{},
            //if doubanbookseen is true ,then display the doubanbook's div
            doubanbookseen:false
        },
        methods: {
            markdown2html: function (m) {
                showdown.setOption('simpleLineBreaks', true);
                //showdown.setOption('\n', '<br/>');
                var converter = new showdown.Converter();
                var html      = converter.makeHtml(m);
                return html;
            },
            formatdate:function (d) {
                return moment(new Date(d)).format("YYYY-MM-DD")
            }
        },
        computed: {

        },
        created: function() {
            //console.log("created");
            var data = commonData();
            data.set("bookid",Request.bookid);
            fetch('/book/book',{method:'post',body:data}).then(function(response) {
                if (response.redirected){
                    window.location.href = response.url;
                }
                return response.json();
            }).then(function(json) {
                if (json.statusCode ==200){
                    app.book = json.info;
                    app.bookseen = true;
                    var data = commonData();
                    data.set("bookid",json.info.id);
                    fetch('/book/doubanbook',{method:'post',body:data}).then(function(response) {
                        if (response.redirected){
                            window.location.href = response.url;
                        }
                        return response.json();
                    }).then(function(json) {
                        if (json.statusCode ==200){
                            var info = JSON.parse(json.info);
                            if (info.count != undefined & info.count!=0){
                                //console.log(info.books[0]);
                                app.doubanbook = info.books[0];
                                app.doubanbookseen = true;
                            }
                        }
                    }).
                    catch(function(ex) {
                        console.log('parsing failed', ex)
                    });
                }
            }).
            catch(function(ex) {
                console.log('parsing failed', ex)
            });
        },
        beforeMount: function () {
            //console.log("beforeMount");
        },
        mounted: function () {
            //console.log("mounted");
        }
    });
});