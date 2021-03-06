const express = require('express');
const app = express();
app.use(express.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient;
const methodeOverride = require('method-override');
app.use(methodeOverride('_method'));
app.set('view engine', 'ejs');
app.use('/public', express.static('public')); // static 파일 보관을 목적으로 public 폴더를 사용하겠다는 의미
require('dotenv').config();

var db;

MongoClient.connect(process.env.DB_URL, function(err, client){
    if(err) {return console.log(err)};

    db = client.db('app_todo');

    app.listen(process.env.PORT, function(){
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


// * search
app.get('/search', function(req, res){
    console.log(req.query.value);
    let condition = [
        {
            $search : {
                index : 'todoSearch',
                text : {
                    query : req.query.value,
                    path: '할일' // 할일과 마감일 둘 다 찾고 싶으면 ['할일', '마감일']
                }
            }
        },
        {
            $sort : { _id : 1 } // 1 은 오름차순, -1 은 내림차순
        },
        {
            $limit : 10 // 가져올 데이터 개수 제한
        },
        // {
        //     $project : {할일 : 1, _id: 0, score : {$meta: 'searchScore'}} // 원하는 항목만 보여줌! 0 은 안 보여주기, 1 은 보여주기
        // }
    ];
    db.collection('post').aggregate(condition).toArray(function(err, result){
        console.log(result);
        res.render('search.ejs', {searchPost : result});
    })
})

// ! Session 방식 로그인 기능 구현
const passport = require('passport');
const localStrategy = require('passport-local').Strategy; // 인증하는 방법을 Strategy 라고 지칭한다.
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res){
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail' // login 을 실패하면 /fail 경로로 이동한다.
}), function(req, res){
    res.redirect('/'); // login 을 성공하면 / 경로로 이동한다.
})

app.get('/mypage', doLogin, function(req, res){
    // console.log(req.user)
    res.render('mypage.ejs', {user : req.user});
})

function doLogin(req, res, next){
    // 로그인을 한 상태라면
    if (req.user){
        next(); // 통과한다.
    } else {
        // res.send("로그인이 필요합니다.");

        res.writeHead(200, {'Content-Type' : 'text/html; charset=utf-8'});

        res.write("<script>alert('로그인이 필요합니다.')</script>");
        res.write("<script>window.location.replace('/login')</script>");
    }
}


// * 로그인 검사
passport.use(new localStrategy({
    usernameField : 'id', // name 이 id 인 input 이 usernameField 이다.
    passwordField : 'pw', // name 이 pw 인 input 이 passwordField 이다.
    session : true, // session 정보를 저장한다.
    passReqToCallback : false, // 아이디,비밀번호 외 다른 정보를 검증할 경우 true 로 작성, 콜백함수에 req 파라미터를 넣어준다.
}, function(inputId, inputPw, done){

    //console.log(inputId, inputPw); // 사용자가 입력한 아이디, 비밀번호 확인

    // db.collection 중 login 에서 id 가 inputId 와 일치하는 데이터를 찾으면
    db.collection('login').findOne({id : inputId}, function(err, result){
        if (err) return done(err);

        // result 에 아무런 값이 담겨있지 않다면(DB 에 아이디가 없으면)
        if (!result) return done(null, false, {message : '존재하지 않는 아이디입니다.'});

        // result 에 값이 담겨 있다면(DB 에 아이디가 있다면)
        // inputPw 와 result 에 담겨있는 pw 가 일치하는지 확인하기
        if (inputPw == result.pw) {
            return done(null, result);
        } else {
            return done(null, false, {message : '비밀번호가 다릅니다.'})
        }
    })
}));


// * 로그인 세션 유지
// id 를 이용하여 세션 저장 및 쿠키 발행 (로그인 성공 시)
passport.serializeUser(function(user, done){
    done(null, user.id);
});

// 특정 세션 데이터를 가진 사람을 DB 에서 검색 (마이페이지 접속 시)
passport.deserializeUser(function(userId, done){
    // DB 에서 user.id 로 사용자를 검색한 후 사용자 정보를 찾아서 전송한다.
    db.collection('login').findOne({id : userId}, function(err, result){
        done(null, result);
    })
});


// ! 회원가입 기능 구현
app.get('/register', function(req, res){
    res.render('register.ejs');
})

app.post('/register', function(req, res){
    db.collection('login').insertOne({id : req.body.id, pw: req.body.pw}, function(err, result){
        res.redirect('/login');
    })
})


// * add (작성자 구별 업데이트로 인한 코드 위치 조정)
// 누군가가 폼에서 /add 로 POST 요청을 하면
app.post('/add', function(req, res){

        // 게시물마다 번호를 달아 저장하기
        // DB.counter 내에서 '총게시물개수'를 찾아서
        db.collection('counter').findOne({name : '총게시물개수'}, function(err, result){
            // console.log(result.totalPosts);
    
            // '총게시물개수' 의 totalPosts 값을 totalPosts 변수에 저장
            var totalPosts = result.totalPosts;
    
            // 전송받아 저장할 데이터들을 submitData 변수에 저장
            var submitData = {
                _id : totalPosts + 1, 
                할일: req.body.content, 
                마감일 : req.body.date, 
                작성자: req.user._id
            }
    
            // 이제 DB.post 에 번호를 단 새로운 게시물을 추가
            db.collection('post').insertOne(submitData, function(err, result){
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

    var delData = {_id : req.body._id}

    console.log(req.body);

    if (req.body.작성자 == req.user._id) {
        db.collection('post').deleteOne(delData, function(err, result){
            console.log('게시물 삭제 완료');
            res.status(200).send({message : '성공했습니다.'});
        })
    } else {
        console.log('게시물 삭제 실패');
        res.status(400).send({message : '실패했습니다.'});
    }
})


// * upload
let multer = require('multer');
const { strategies } = require('passport/lib');
var path = require('path');

var storage = multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, './public/images')
    },
    filename : function(req, file, cb){
        cb(null, file.originalname)
    },
    filefilter : function(req, file, cb){
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg'){
            return cb(new Error('PNG, JPG 파일만 업로드 가능합니다.'));
        }
        cb(null, true)
    },
    limits : {
        fileSize: 1024 * 1024
    }
});

var upload = multer({storage : storage});

app.get('/upload', function(req, res){
    res.render('upload.ejs')
})

app.post('/upload', upload.single('image'), function(req, res){
    res.send('파일 업로드 완료')
});

app.get('/images/:img', function(req, res){
    res.sendFile(__dirname + '/public/images/' + req.params.img)
})


// * chatroom
const {ObjectId} = require('mongodb');

app.post('/chatroom', doLogin, function(req, res){

    let saveData = {
        post : parseInt(req.body.글번호),
        title : req.body.할일,
        members : [ObjectId(req.body.작성자), req.user._id], // 글작성자와 채팅요청자
        date : new Date() // 현재 날짜
    }

    db.collection('chatroom').insertOne(saveData).then(()=>{
        res.send('채팅방 개설 완료')
    })
})



// * chat
app.get('/chat', doLogin, function(req, res){

    db.collection('chatroom').find({members : req.user._id}).toArray().then((result)=>{
        res.render('chat.ejs', {data : result})
    })
})


// * message
app.post('/message', doLogin, function(req, res){

    console.log(req.body);

    let saveData = {
        parent: req.body.parent,
        content: req.body.content,
        userid : req.user._id,
        date: new Date()
    }

    db.collection('message').insertOne(saveData).then(()=>{
        console.log('데이터 저장 완료');
        res.send('데이터 저장 완료');
    })
})


// * communication
app.get('/message/:id', doLogin, function(req, res){

    res.writeHead(200, {
        'Connection' : 'keep-alive',
        'Content-Type' : 'text/event-stream',
        'Cache-Control' : 'no-cache'
    })

    db.collection('message').find({parent : req.params.id}).toArray().then((result)=>{
        res.write('event: test\n')
        res.write(`data: ${JSON.stringify(result)}\n\n`)
    });

    const pipeline = [
        { $match: { 'fullDocument.parent' : req.params.id } } // fullDocument 꼭 붙여주기!
    ];

    const collection = db.collection('message');
    const changeStream = collection.watch(pipeline); // .watch() 함수는 실시간으로 확인해주는 역할
    changeStream.on('change', (result)=>{
        console.log(result.fullDocument);
        res.write('event: test\n')
        res.write(`data: ${JSON.stringify([result.fullDocument])}\n\n`);
    })
})