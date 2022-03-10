const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient;
const methodeOverride = require('method-override');
app.use(methodeOverride('_method'));
app.set('view engine', 'ejs');
app.use('/public', express.static('public')); // static 파일 보관을 목적으로 public 폴더를 사용하겠다는 의미

var db;

MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.e8wvg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(err, client){
    if(err) {return console.log(err)};

    db = client.db('app_todo');

    app.listen(8080, function(){
        console.log('listening on 8080');
    });

})


// ! Home
app.get('/', function(req, res){
    // res.sendFile( __dirname + '/index.html');
    res.render('index.ejs')
});


// ! Write
app.get('/write', function(req, res){
    res.render('write.ejs')
});


// ! List
app.get('/list', function(req, res){

    db.collection('post').find().toArray(function(err, result){
        // console.log(result);
        res.render('list.ejs', {post : result});
    });

});


// * add
// 누군가가 폼에서 /add 로 POST 요청을 하면
app.post('/add', function(req, res){

    // 게시물마다 번호를 달아 저장하기
    // DB.counter 내에서 '총게시물개수'를 찾아서
    db.collection('counter').findOne({name : '총게시물개수'}, function(err, result){
        // console.log(result.totalPosts);

        // '총게시물개수' 의 totalPosts 값을 totalPosts 변수에 저장
        var totalPosts = result.totalPosts;

        // 이제 DB.post 에 번호를 단 새로운 게시물을 추가
        db.collection('post').insertOne({_id : totalPosts + 1, 할일: req.body.content, 마감일 : req.body.date}, function(err, result){
            console.log('게시물 저장 완료!');

            // DB.counter 의 '총게시물개수' 의 totalPosts 값을 1씩 증가
            db.collection('counter').updateOne({name : '총게시물개수'},{ $inc : {totalPosts: 1} }, function(err, result){
                console.log('총 게시물 개수 업데이트 완료!');
            });
        });
    });

    // res.send('게시물 추가 완료');
    res.redirect('/list') 
})


// * delete
// 누군가가 삭제 버튼을 클릭하여 /delete 로 DELETE 요청을 하면
app.delete('/delete', function(req, res){
    // DB 에서 게시글 삭제하기
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne(req.body, function(err, result){
        console.log('게시물 삭제 완료');
        res.status(200).send({message : '성공했습니다.'});
    })
})


// * detail
// 누군가가 더보기 버튼을 클릭하여 /detail 로 GET 요청을 하면
app.get('/detail/:id', function(req, res){
    // DB 에서 게시글 불러오기
    req.params.id = parseInt(req.params.id);
    db.collection('post').findOne({_id : req.params.id}, function(err, result){
        console.log(result);
        res.render('detail.ejs', {detail : result});
    })
});


// * edit
// 누군가가 수정 버튼을 클릭하여 /edit 으로 GET 요청을 하면
app.get('/edit/:id', function(req, res){
    // DB 에서 게시글 불러오기
    req.params.id = parseInt(req.params.id);
    db.collection('post').findOne({_id : req.params.id}, function(err, result){
        console.log(result);
        res.render('edit.ejs', {edit : result});
    })
})

// 누군가가 폼에서 /edit 으로 PUT 요청을 하면
app.put('/edit', function(req, res){
    // 폼에 기재된 데이터를 db.collection 에 업데이트하기
    req.body.id = parseInt(req.body.id);
    db.collection('post').updateOne({_id : req.body.id}, {$set : {할일: req.body.content, 마감일 : req.body.date}}, function(){
        console.log('게시물 수정 완료');
        res.redirect('/list') 
    })
})