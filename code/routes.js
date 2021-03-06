const WSfunctions = require('./websocket_functions.js');
const Weather=require("./weather.js");
const Buildings=require("./buildings.js");
const Classrooms=require("./classroom.js");

module.exports= function(app,passport, wss,couch,request,express,amqp,Flickr) {

  // render index page
  app.get('/', function (req,res){
    res.render('index.ejs');
  });

  // render login page
  app.get('/login', function (req,res){
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // initiate login procedure
  app.post('/login',passport.authenticate('login',{
      successRedirect: '/profile',
      failureRedirect: '/login',
      failureFlash:true
  }));

  // render signup page
  app.get('/signup', function (req,res){
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // initiate signup procedure
  app.post('/signup',passport.authenticate('signup',{
    successRedirect: '/',
    failureRedirect: '/signup',
    failureFlash:true
  }));

  // account profile, available only if the user has already logged
  app.get('/profile', isLoggedIn, function(req, res) {
    console.log("[routes.js] rendering profile view");
    res.render('profile.ejs', {user:req.user});
  });

  // logout
  app.get('/logout', function(req, res) {
    WSfunctions.close_ws(wss, req.user._id); //need to close cliets connected in chat (not only one if you open chat in multiple tabs)
    req.logout();
    res.redirect('/');
  });

  //initiate OAuth2 login with Google credentials
  app.get('/google', passport.authenticate('google', { scope : ['profile'] }));

  //if this is called the nthe user has logged on google, so we must log him in in the app
  //and enventually save him in the DB
  app.get('/auth',
            passport.authenticate('google', {
                    successRedirect : '/profile',
                    failureRedirect : '/'
            }));


  app.get("/registration",(req,res) => {
  var page;
  var reg_id = req.query.registration;
  couch.get('users', reg_id).then(({data, headers, status}) => {
      var rev = data._rev;
      couch.update("users", {   //updating the user to the confirmed status
        _id: reg_id,
        _rev: rev,
           "local": {
       "username": data.local.username,
       "password": data.local.password,
       "email": data.local.email,
       "IsConfirmed": true
   }
        }).then(({data, headers, status}) => {
}, err => {
    console.log("[routes.js] "+err);
    });

	res.render('registered.ejs',{page : "http://localhost:8080/login"});
  },err => {
    res.render('registered.ejs',{page : 'http://localhost:8080/signup'});
  });
});

//getting the home page
app.get('/home',isLoggedIn, (req, res) => {
  app.use(express.static('./views/support/home')); //to load chat script and css
    Weather.send_page(request, req, res);
  });

  //getting building page
  app.get("/edificio",isLoggedIn,(req,res)=>{
    app.use(express.static('./views/support/building')); //to use files of web pages
    Buildings.send_page(req,res,couch,request);
  }, err => {
      res.redirect('/home');
  });

  //getting classroom page
  app.get("/aula",isLoggedIn,function(req,res){
    Classrooms.send_page(req,res,couch,Flickr);
  });
  //add a comment
  app.post("/aula",function(req,res){
    Classrooms.send_comment(req,res,amqp);
  });

}

// callback which ensures hat the session is authenticated
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    if(req.user.local!=undefined){
        if(req.user.local.IsConfirmed == true){
        console.log("[routes.js] user logged");
        return next(); // loads the page which was requested
        }
    }
    else if(req.user.google != undefined){
        console.log("[routes.js] user logged with google");
        return next(); // loads the page which was requested
    }
    else{
        res.redirect('/'); // redirects
    }
  } else {
    res.redirect('/');
  }
}

module.exports.isLoggedIn=isLoggedIn;
