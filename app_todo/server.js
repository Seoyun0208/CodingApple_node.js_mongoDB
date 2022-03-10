const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

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
    res.sendFile( __dirname + '/index.html');
});


// ! Write
app.get('/write', function(req, res){
    res.sendFile(__dirname + '/write.html');
});


// ! List
app.get('/list', function(req, res){

    db.collection('post').find().toArray(function(err, result){
        // console.log(result);
        res.render('list.ejs', {posts : result});
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

    res.send('게시물 추가 완료');
    
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

