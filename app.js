//=====REQUIRE STATEMENTS======
var express                     = require("express"),
    app                         = express(),
    mongoose                    = require("mongoose"),
    multer                      = require("multer"),
    path                        = require("path"),
    bodyParser                  = require("body-parser"),
    passport                    = require("passport"),
    LocalStrategy               = require("passport-local"),
    passportLocalMongoose       = require("passport-local-mongoose"),
	fs							= require("fs"),
	methodOverride              = require("method-override"),
	cloudinary = require('cloudinary');
mongoose.connect("mongodb://localhost:27017/ualu_app", { useNewUrlParser: true, useUnifiedTopology: true });
app.use(express.static("assets"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(require("express-session")({
	secret : "Good company always makes you feel Good!" ,
	resave : false,
	saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	next();
});
// fuzzy Search
function escapeRegex(text){
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
//====Middleware====
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
	return next();
	}
	res.redirect('/signin');
}

//====== SCHEMAS =========
// Books Schema
var bookSchema=new mongoose.Schema({
	title: String,
	author: String,
	price: String,
	description: String,
	image : String,
	imageId: String
});

// User Schema
var userSchema=new mongoose.Schema({
	username: { type: String, lowercase: true },
	password: String,
	firstname : String,
	lastname : String,
	mobileno : String,
	city : String,
	college : String
});
userSchema.plugin(passportLocalMongoose);
//Uploading Images
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

cloudinary.config({ 
  cloud_name: 'dvucpfyhm', 
  api_key: 517324411392572, 
  api_secret: 'WhdypBcsUYx_90mbICGpDGCdsCA'
});
//======MODELS======
var Book = mongoose.model('Book', bookSchema);
var User = mongoose.model('User', userSchema);
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//======= ROUTES =======	 
//Landing Route
app.get('/', function(req, res){
	res.render('landingPage');
});
//=====AUTH Routes=====
// Sign Up Routes
app.get('/signup', function(req,res){
	res.render('signUpPage');
});
app.get('/signup/detail', function(req,res){
	res.render('userDetail');
});
app.post('/signup', function(req,res){
    req.body.username
	req.body.password
	User.register(new User({username : req.body.username}),req.body.password,function(err,user){
		if(err){
			console.log(err);
			return res.render("signUpPage");   
			}
		passport.authenticate("local")(req,res,function(){
			res.redirect("/signup/detail");
		});
	});
});
app.post('/signup/detail', function(req,res){ 
	User.findByIdAndUpdate(req.user._id, req.body.detail, function(err,
	updatedUser) {
	if (err) {
		console.log(err);
	}
		res.redirect('/books');
	});
});
// Sign In Route
app.get('/signin', function(req,res){
	res.render('signInPage');
});
app.post("/signin",passport.authenticate("local" ,{ 
	successRedirect : "/books",
	failureRedirect : "/signin"
    }),function(req,res){          
});
// Log Out Route
app.get('/signout', function(req,res){
	req.logout();
	res.redirect("/");
});
//======Books Route=======
//Main book page Route
app.get('/books',function(req, res){                      // Working on this...
	if(req.query.search){
		//Search query using escapeRegex
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		var booksData = Book.find({title : regex});
		booksData.exec(function(err, data){
			if(err) {
				console.log(err);
			} else {
				res.render('mainPage', {records: data});
			}
		});	
	}
	else{
		//Show all data from database
		var booksData = Book.find({});
		booksData.exec(function(err, data){
			if(err) {
				console.log(err);
			} else {
				res.render('mainPage', {records: data});
			}
		});
	}
});
// New Book Route
app.get('/books/new', function(req, res){
	res.render('newbooks');
});
app.post('/books', upload.single('image'), function(req,res){
	cloudinary.uploader.upload(req.file.path, function(result) {
  // add cloudinary url for the image to the campground object under image property
		req.body.newBook.image = result.secure_url;
		req.body.newBook.imageId = result.public_id;
		Book.create(req.body.newBook, function(err, book){
			if(err) {
				console.log(err);
			} else {
				console.log(book);
				res.redirect("books");
			}
		});
	});
});

// Book Details Page Route
app.get('/books/:id', function(req, res){
	var booksData = Book.findById(req.params.id);
	booksData.exec(function(err, data){
		if(err) {
			console.log(err);
		} else {
			res.render('bookDetail', {book: data});
		}
	});
});

app.get('/books/:id/edit', function(req, res){
	var bookData = Book.findById(req.params.id);
	bookData.exec(function(err, data){
		if(err) {
			console.log(err);
		} else {
			res.render('editbook', {book: data});
		}
	});
});

app.put("/books/:id", upload.single('image'), function(req, res){
    Book.findById(req.params.id, async function(err, book){
        if(err){
            console.log(err);
        } else {
            if (req.file) {
              try {
                  await cloudinary.uploader.destroy(book.imageId);
                  var result = await cloudinary.uploader.upload(req.file.path);
                  book.imageId = result.public_id;
                  book.image = result.secure_url;
              } catch(err) {
                  console.log(err);
              }
            }
            book.title = req.body.title;
            book.author = req.body.author;
            book.price = req.body.price;
            book.description = req.body.description;
            book.save();
			res.redirect("/books/" + book._id);
        }
    });
});


// app.put('/books/:id', upload, function(req, res){
// 	var bookData = Book.findById(req.params.id);
// 	var path2 = 'assets/uploads/'+(bookData.image);
// 	fs.unlink(path2, (err) => {
// 	  if (err) {
// 		  console.log(typeof bookData.image);
// 		  console.log(bookData.image);
// 		console.error(err)
// 		return
// 	  }

// 	  //file removed
// 	});
// 	Book.findByIdAndUpdate(req.params.id,{
// 		title : req.body.title,
// 		author : req.body.author,
// 		price : req.body.price,
// 		description : req.body.description
// 	},  function(err, data){
// 						   if(err){
// 		console.log(err);
// 	} else{
// 		res.redirect('/books/'+data._id);
// 	}
// 	});
// });

app.delete('/books/:id', function(req, res) {
  Book.findById(req.params.id, async function(err, book) {
    if(err) {
      console.log(err);
    }
    try {
        await cloudinary.uploader.destroy(book.imageId);
        book.remove();
        res.redirect('/books');
    } catch(err) {
        if(err) {
         console.log(err);
        }
    }
  });
});

//====== END OF ROUTES =====
//start server
app.listen(3000, function(){
	console.log("Server is listening...");
});