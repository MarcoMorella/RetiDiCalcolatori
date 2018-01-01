module.exports= function(app,passport) {

  app.get('/', function (req,res){
    res.render('home.ejs');
  });

  app.get('/login', function (req,res){
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  app.post('/login',passport.authenticate('login',{
      successRedirect: '/profile',
      failureRedirect: '/login',
      failureFlash:true
  }));

  app.get('/signup', function (req,res){
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  app.post('/signup',passport.authenticate('signup',{
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash:true
  }));

  app.get('/profile', isLoggedIn, function(req, res) {
    console.log("rendering profile view");
    res.render('profile.ejs', {user:req.user});
  });

  app.get('/logout', function(req, res) {
   req.logout();
   res.redirect('/');
  });

  //login con google!
  app.get('/google', passport.authenticate('google', { scope : ['profile'] }));

  //callback dopo che l'utente si è autenticato su Google
  app.get('/auth',
            passport.authenticate('google', {
                    successRedirect : '/profile',
                    failureRedirect : '/'
            }));
}

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    console.log("user logged");
    return next();
  }
  res.redirect('/');
}
