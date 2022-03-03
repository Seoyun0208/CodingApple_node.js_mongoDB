const express = require('express');
const app = express();

app.use(express.urlencoded({extended: true}));

const MongoClient = require('mongodb').MongoClient;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.e8wvg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(err, client){
    app.listen(8080, function(){
        console.log('listening on 8080');
    });
})

app.get('/', function(req, res){
    res.sendFile( __dirname + '/index.html');
});

app.get('/write', function(req, res){
    res.sendFile(__dirname + '/write.html');
});

app.post('/add', function(req, res){
    res.send('전송완료')
    console.log(req.body.content);
    console.log(req.body.date);
});