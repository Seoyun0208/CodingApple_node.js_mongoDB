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
app.post('/add', function(req, res){
    res.send('전송완료');
    
    db.collection('post').insertOne({할일: req.body.content, 마감일 : req.body.date}, function(err, result){
        console.log('데이터 저장 완료!')
    })
})

