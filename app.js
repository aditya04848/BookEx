//=====REQUIRE STATEMENTS======
var express                     = require("express"),
    app                         = express(),
    session						= require('express-session'),
    mongoose                    = require("mongoose"),
    multer                      = require("multer"),
    path                        = require("path"),
    bodyParser                  = require("body-parser"),
    passport                    = require("passport"),
    LocalStrategy               = require("passport-local"),
    passportLocalMongoose       = require("passport-local-mongoose"),
	fs							= require("fs"),
	methodOverride              = require("method-override"),
	cloudinary      			= require('cloudinary'),
	asyncc 						= require('async'),
	nodemailer 					= require('nodemailer'),
	crypto 						= require('crypto'),
	passportGoogle 				= require("./auth/google"),
	passportFacebook			= require("./auth/facebook"),
	User 						= require('./models/User'),
	Book						= require('./models/Book'),
	Comment						= require('./models/Comment'),
	Rating						= require('./models/Rating'),
	Cart						= require('./models/Cart'),
	{ google }					= require('googleapis'),
	axios 						= require('axios'),
	querystring					= require('querystring'),
	fetch 						= require('node-fetch'),
    flash                       = require('express-flash-messages'),
	Ebook						= require('./models/eBook'),
	Misc						= require('./models/Misc'),
	notif						= require('./models/notif'),
	async 						= require('async');
mongoose.connect("mongodb+srv://BookEx:7230429adi@cluster0.fcnj1.mongodb.net/ualu_app?retryWrites=true&w=majority",{useUnifiedTopology:true, useNewUrlParser:true});
app.use(express.static("assets"));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(session({
	secret : "Good company always makes you feel Good!" ,
	resave : false,
	saveUninitialized : false
}));
app.use(flash());
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next){
	if(req.user == null){
		res.locals.currentUser = req.user;
		next();
	}
	else if(req.user.doc==null)
	{
		res.locals.currentUser = req.user;
		next();
	}
	else{
		res.locals.currentUser = req.user.doc;
		next();
	}
})

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

/*
    Setting up the transporter for the Nodemailer
*/
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kitabbuddy1234@gmail.com',
    pass: 'kitab1234'
  },
	tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false
  }
});
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
/*------------------SMTP Over-----------------------------*/



//====== SCHEMAS =========
// Books Schema
// var bookSchema=new mongoose.Schema({
// 	title: String,
// 	author: String,
// 	price: String,
// 	description: String,
// 	image : String,
// 	imageId: String,
// 	uploader : String
// });

// User Schema
// var userSchema=new mongoose.Schema({
// 	username: { type: String, lowercase: true },
// 	password: String,
// 	firstname : String,
// 	lastname : String,
// 	mobileno : String,
// 	city : String,
// 	college : String
// });
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
var pdfFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(pdf|xlsx|docx|doc)$/i)) {
        return cb(new Error('Only PDF/Excel/Word files are allowed!'), false);
    }
    cb(null, true);
};
var pdfupload = multer({ storage: storage, fileFilter: pdfFilter});

cloudinary.config({ 
  cloud_name: 'dvucpfyhm', 
  api_key: 517324411392572, 
  api_secret: 'WhdypBcsUYx_90mbICGpDGCdsCA'
});
//======MODELS======
// var Book = mongoose.model('Book', bookSchema);
//======= ROUTES ======

//Landing Route
app.get('/', function(req, res){
	if(req.isAuthenticated()) {
		User.findById(req.user.doc._id, function(err, user){
			if(err) console.log(err);
			console.log(user.seen);
			res.render('landingPage', {show: true, seen: user.seen});
		});
	}
	else {
		res.render('landingPage', {show: false});
	}
});  
//=====AUTH Routes=====
// Sign Up Routes
app.get('/signup', function(req,res){
	res.render('signUpPage');
});
app.get('/about-us', function(req, res){
	if(req.isAuthenticated()) {
        User.findById(req.user.doc._id, function(err, user){
            if(err) console.log(err);
            res.render('aboutUs', {show: true, seen: user.seen});
        });
    }
    else {
        res.render('aboutUs', {show: false});
   }
	// res.render('aboutUs');
});
app.get('/signup/detail', function(req,res){
	res.render('userDetail');
});
app.post('/signup', function(req,res){
	var OTP = Math.floor(100000 + Math.random() * 900000);
	User.register(new User({username : req.body.username, otp: OTP, firstname: req.body.firstname, lastname: req.body.lastname, mobileno: req.body.mobileno, city:req.body.city, college: req.body.college}),req.body.password,function(err,user){
		if(err){
			console.log(err);
			return res.render("signUpPage");   
			}
		passport.authenticate("local")(req,res,function(){
			// res.redirect("/signup/detail");
			res.redirect('/verify');
		});
	});
});

app.get('/verify',function(req, res){
	const mailOptions = {
	  	from: '"KitabBuddy Admin" <kitabbuddy1234@gmail.com>',
	  	to: req.user.username,
	  	subject: 'Email Confirmation',
	  	text: 'Hello there, just a step away from creating your account. Here is your 6 digit pin. '+ req.user.otp,
	  	html: 'Hello there, just a step away from creating your account. Here is your 6 digit pin. <br><h2>'+ req.user.otp +'</h2>'
	};

	transporter.sendMail(mailOptions, function(error, info){
	  	if (error) {
			console.log(error);
	  	} else {
	    	console.log('OTP sent: ' + info.response);
	  	}
	}); 
	res.render('enterOTP');
});
app.post('/verify', function(req, res){
	if(req.user.otp == req.body.otp)
	{
		User.findOneAndUpdate({otp: req.user.otp}, {isVerified: true}, function(err, data){
			if(err)
				console.log(err);
			else
			{
				res.redirect('/');
			}
		});
	}
	else
		res.redirect('/verify');
});



app.post('/signup/detail', function(req,res){
	if(req.user.doc == null) {
		User.findByIdAndUpdate(req.user._id, req.body.detail, function(err,user) {
		if (err) {
			console.log(err);
		}
			// "user" is the user with newly updated info
			user.save(function(err) {
				if (err) return next(err)
				// What's happening in passport's session? Check a specific field...
				console.log("Before relogin: "+req.user)

				req.login(user, function(err) {
					if (err) return next(err)

					console.log("After relogin: "+req.user)
					res.send(200)
				})
			})
		});
	}
	else {
		User.findByIdAndUpdate(req.user.doc._id, req.body.detail, function(err,data) {
		if (err) {
			console.log(err);
		}
			res.redirect('/');
		});
	}
	
});
// Sign In Route
app.get('/signin', function(req,res){
	res.render('signInPage');
});
app.post("/signin",passport.authenticate("local" ,{ 
	successRedirect : "/",
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

app.get('/books', function(req, res) {
	if(req.query.search) {
		var string = encodeURIComponent(req.query.search);
		// console.log(req.query.search);
		res.redirect("/books/page/1/?search=" + string)
	}
	else {
		res.redirect("/books/page/1");
	}
});

app.get('/books/page/:page',function(req, res){ 
	var perPage = 16
    var page = req.params.page || 1
	if(req.query.search){
		//Search query using escapeRegex
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		var book_data = Book.find({title: regex});
		var booksData = Book.find({title : regex})
        .skip((perPage * page) - perPage)
        .limit(perPage);
		booksData.exec(function(err, data){
			book_data.count().exec(function(err, count) {
				if(err) {
					console.log(err);
				} else {
					var string = encodeURIComponent(req.query.search);
					if(req.isAuthenticated()) {
						User.findById(req.user.doc._id, function(err, user){
							if(err) console.log(err);
							res.render('mainPage', {records: data, current: page, pages: Math.ceil(count/perPage), query: string, show: true, seen: user.seen});
						});
					}
					else {
						res.render('mainPage', {records: data, current: page, pages: Math.ceil(count/perPage), query: string, show: false});
				   }
					// res.render('mainPage', {records: data, current: page, pages: Math.ceil(count/perPage), query: string});
					// console.log(data);
				}
			});
		});	
	}
	else{
		//Show all data from database
		var booksData = Book.find({})
        .skip((perPage * page) - perPage)
        .limit(perPage);
		booksData.exec(function(err, data){
			Book.count().exec(function(err, count) {
				if(err) {
					console.log(err);
				} else {
					var string = "";
					if(req.isAuthenticated()) {
						User.findById(req.user.doc._id, function(err, user){
							if(err) console.log(err);
							res.render('mainPage', {records: data, current: page, pages: Math.ceil(count/perPage), query: string, show: true, seen: user.seen});
						});
					}
					else {
						res.render('mainPage', {records: data, current: page, pages: Math.ceil(count/perPage), query: string, show: false});
				   }
					// res.render('mainPage', {records: data, current: page, pages: Math.ceil(count/perPage), query: string});
				}
			});
		});	
	}
});
// New Book Route
app.get('/books/new', function(req, res){
	if(req.isAuthenticated()){
			res.render('newbooks');
		}
	else{
		res.redirect("/signup");
	}

});
// My Book Route
app.get('/books/mybook', function(req, res){
	res.render('myBook');
});
// cart Route
app.get('/books/cart', function(req, res){
	res.render('cart');
});
app.post('/books', upload.single('image'), function(req,res){
	cloudinary.uploader.upload(req.file.path, function(result) {
  // add cloudinary url for the image to the campground object under image property
		req.body.newBook.image = result.secure_url;
		req.body.newBook.imageId = result.public_id;
		req.body.newBook.uploader = req.user.doc.username;
		Book.create(req.body.newBook, function(err, book){
			if(err) {
				console.log(err);
			} else 
			{
				const mailOptions = {
				  from: '"KitabBuddy Admin" <kitabbuddy1234@gmail.com>',
				  to: book.uploader,
				  subject: 'Thank you! for showing a kind heart.',
				  html: "Hello there, hope you are having a good day. Thank you so much for lending your product. The details provided by you for the product is under verification and will be uploaded on the website once verified. Also, a mail will be sent to you notifying the verification.<br>Below are the details uploaded by you.<br><hr><div class='container' style='border: 1px solid black ; margin:10% auto; border-radius:10px'><div class='row' style='margin:75px 50px 40px;'><div class='col-lg-6' style='text-align:center; margin-bottom: 50px;'><img src='"+book.image+"' alt='...' class='img-thumbnail' style='height: 300px;'></div><div class='col-lg-6'>		<h1 style='text-align:center;'>"+book.title+"</h1><h6 style='text-align:center;'>By: "+book.author+"</h6><hr><p>"+book.description+"</p></div></div>"
				};

				transporter.sendMail(mailOptions, function(error, info){
				  if (error) {
					console.log(error);
				  } else {
				    console.log('Email sent: ' + info.response);
					res.redirect('/books');
				  }
				});
				
				// res.redirect("/books");
			}
		});
	});
});

// Book Details Page Route
app.get('/books/:id', function(req, res){
	var booksData = Book.findById(req.params.id);
	booksData.populate('ratings').exec(function(err, data){
		if(err) {
			console.log(err);
		} else {
			if(data.ratings.length > 0) {
              var ratings = [];
              var length = data.ratings.length;
              data.ratings.forEach(function(rating) { 
                ratings.push(rating.rating);
              });
              var rating = ratings.reduce(function(total, element) {
				  return total + element;
              });
				if(!data.rating)
					data.rating = 0;
              data.rating = rating / length;
              data.save();
            }
			res.render('bookDetail', {book: data});
		}
	});
});

app.get('/books/:id/edit', function(req, res){
	var bookData = Book.findById(req.params.id); // query
	bookData.exec(function(err, data){
		if(err) {
			console.log(err);
		} else {
			res.render('editbook', {book: data, editing: 'books'});
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
			book.is_display = false;
            book.description = req.body.description;
            book.save();
			if(err) {
				console.log(err);
			} else 
			{
				const mailOptions = {
				  from: '"KitabBuddy Admin" <kitabbuddy1234@gmail.com>',
				  to: book.uploader,
				  subject: 'Thank you! for showing a kind heart.',
				  html: "Hello there, hope you are having a good day. Thank you so much for lending your product. The details provided by you for the product is under verification and will be uploaded on the website once verified. Also, a mail will be sent to you notifying the verification.<br>Below are the details uploaded by you.<br><hr><div class='container' style='border: 1px solid black ; margin:10% auto; border-radius:10px'><div class='row' style='margin:75px 50px 40px;'><div class='col-lg-6' style='text-align:center; margin-bottom: 50px;'><img src='"+book.image+"' alt='...' class='img-thumbnail' style='height: 300px;'></div><div class='col-lg-6'>		<h1 style='text-align:center;'>"+book.title+"</h1><h6 style='text-align:center;'>By: "+book.author+"</h6><hr><p>"+book.description+"</p></div></div>"
				};

				transporter.sendMail(mailOptions, function(error, info){
				  if (error) {
					console.log(error);
				  } else {
				    console.log('Email sent: ' + info.response);
					res.redirect('/books');
				  }
				});
			// res.redirect("/books/" + book._id);
        	}
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


// Secret Routes
app.get('/secretkitab04848', function(req,res){
	//Show all data from database
	var booksData = Book.find({});
	booksData.exec(function(err, data){
		if(err) {
			console.log(err);
		} else {
			res.render('secretMainPage', {records: data});
		}
	});
});

app.get('/secretkitab04848/:id/accept', function(req, res) {
	Book.findByIdAndUpdate(req.params.id, {is_display : true}, function(err, book){
		if(err)
			console.log(err);
		else
			res.redirect('/secretkitab04848');
	});
});


// Google Signup Routers
app.get('/signup/google',
  passportGoogle.authorize('google', { scope: ["email profile https://www.googleapis.com/auth/drive"],  accessType: 'offline', prompt: 'consent' }));

app.get('/signup/google/callback',
  passportGoogle.authenticate('google', { failureRedirect: '/signup' }),
  function(req, res) {
	if(req.user.doc.city === undefined || req.user.doc.college === undefined || req.user.doc.mobileno === undefined) 
		{
			res.redirect('/signup/detail');
		}
	else{
		// Adding Notification
		var message = "Welcome to BookEx";
		var new_notif = new notif({
			content: message
		});
		new_notif.save();
		User.findById(req.user.doc._id, function(err, user){
			if(err) console.log(err);
			else {
				user.notification.push(new_notif);
				user.seen = false;
				user.save();
				res.redirect('/');
			}
		});
	}
  });

// Facebook Signup Routers
app.get('/signup/facebook',
  passportFacebook.authenticate('facebook', {scope:"email"}));

app.get('/signup/facebook/callback',
  passportFacebook.authenticate('facebook', { failureRedirect: '/signup' }),
  function(req, res) {
    // Successful authentication, redirect home.
    if(req.user.doc.city === undefined || req.user.doc.college === undefined || req.user.doc.mobileno === undefined) 
		{
			res.redirect('/signup/detail');
		}
	else{
		res.redirect('/');
	}
  });


// Buy Routes
app.get('/books/:id/buy', function(req, res){
	Book.findById(req.params.id, function(err, data){
		if(err)
			console.log(err);
		else
			res.render('buybook.ejs', {records: data, buying: 'books'});
	});
});

// Mail Send Route
app.get('/books/:id/accepted', function(req, res){
	Book.findById(req.params.id, function(err, book) {
		User.findById(req.user.doc._id, function(err, buyer){
			var book = Book.findById(req.params.id);
			User.findById(book.uploader, function(err, seller){
				// send notification to seller
				var seller_message = "";
				
				// send notification to buyer
			});
		});
		res.redirect('/');
	});
});


// My Books Route
app.get('/mybooks', function(req, res){
	if(req.isAuthenticated())
	{
		var booksData = Book.find({}); // query
		var ebookData =	Ebook.find({});
		var miscData  =	Misc.find({});

		booksData.exec(function(err, Booksdata){
			if(err) {
				console.log(err);
			} else {
				ebookData.exec(function(err, Ebooksdata){
					if(err) console.log(err);
					else {
						miscData.exec(function(err, Miscdata){
							if(err) console.log(err);
							else {
								var data = Booksdata.concat(Miscdata,Ebooksdata);
								res.render('myBooks', {records: data});
							}
						})
					}
				})
			}
	    });
	}
	else{
		res.redirect('/signin');
	}
});
 

// Ratings and Comments Route
app.get('/books/:id/comment', function(req, res){
	Book.findById(req.params.id, function(err, data){
		if(err)
			console.log(err);
		else
			res.render('commentPage', {record: data, commenting: 'books'});
	});
});

app.post('/books/:id/comments', function(req,res){
	Book.findById(req.params.id, function(err, book){
		if(err){
			console.log("Book error!");
			console.log(err);
		}
		else{
			
			var new_rating = new Rating({
				rating: parseInt(req.body.rating),
				text: req.body.comment,
				firstname : req.user.doc.firstname,
				lastname :req.user.doc.lastname
			});
			
			new_rating.save();
			
			book.ratings.push(new_rating);
			book.save();
			console.log("Rating: ", new_rating);
			console.log("Book: ", book);
			res.redirect('/books/'+book._id.toString());
		}
	});
})


// Cart Route

app.post('/books/:id/cart', function(req, res){
		if(req.user.doc==null)
		{
			User.findById(req.user._id, function(err, user){
				if(err)
					console.log(err);
				Book.findById(req.params.id, function(err, book){
					user.cart.push(book);
					user.cart_items = user.cart_items + 1;
					user.total_price = user.total_price + parseInt(book.price);
					user.save();
					res.redirect('/books/'+book._id.toString());
				});
			});
		}
		else{
			User.findById(req.user.doc._id, function(err, user){
				if(err)
					console.log(err);
				Book.findById(req.params.id, function(err, book){
					user.cart.push(book);
					user.cart_items = user.cart_items + 1;
					user.total_price = user.total_price + parseInt(book.price);
					user.save();
					res.redirect('/books/'+book._id.toString());
				});
			});
		}
});

app.get('/:id/cart', function(req, res){
	var UserData;
	UserData = User.findById(req.params.id);
	UserData.populate('cart').exec(function(err, data){
		if(err)
			console.log(err);
		else{
			res.render('cart', {books: data});
		}
	});
});

// Delete Book From Cart
app.get('/:id1/cart/:id2', function(req, res){
	var UserData;
	UserData = User.findById(req.params.id1);
	UserData.populate('cart').exec(function(err, data){
		if(err)
			console.log(err);
		else{
			UserData.populate('cart').exec(function(err, user){
				var len = user.cart_items;
				var price = 0;
				for(var i=0; i<len; i++){
					if(user.cart[i]._id.toString() == req.params.id2.toString()){
						price = parseInt(user.cart[i].price);
						// delete user.cart[i];
						user.cart.splice(i, 1);
						break;
					}
				}
				user.total_price = user.total_price - parseInt(price);
				user.cart_items = user.cart_items - 1;
				user.save();
				res.redirect("/" + req.params.id1 + "/cart");
			});
		}
	});
});

// Cart Buy Implementation
app.get('/:id/buy', function(req, res) {
	res.render('buyCart');

});

app.get('/:id/accepted', function(req, res) {
	User.findById(req.params.id, function(err, user){
		if(err)
			console.log(err);
		user.cart.forEach(function(book_id, index){
			Book.findById(book_id, function(err, book){
				if(err)
					console.log(err);
				// Notification Required
			});
		});	
		user.cart.splice(0, user.cart_items);
		user.cart_items = 0;
		user.total_price = 0;
		user.save()
	});
	res.redirect('/');
});
// //////////////////////////////////////////////////////
// app.get('/notif', function(req, res){
//     req.flash('notify', 'This is a test notification.')
//     res.render('landingPage')
// })
//////////////////////////////////////////////////////

// Pagination
// app.get('/products/:page', function(req, res, next) {
//     var perPage = 20;
//     var page = req.params.page || 1;

//     Book
//         .find({})
//         .skip((perPage * page) - perPage)
//         .limit(perPage)
//         .exec(function(err, book) {
//             Book.count().exec(function(err, count) {
//                 if (err) return next(err)
//                 res.render('/books', {
//                     book: book,
//                     current: page,
//                     pages: Math.ceil(count / perPage)
//                 });
//             });
//         });
// });

// Ebooks Route
app.get('/ebooks', function(req, res){
	if(req.query.search){
		var string = encodeURIComponent(req.query.search);
		res.redirect('/ebooks/page/1/?search='+string);
	}
	else {
		res.redirect('/ebooks/page/1');
	}
});

app.get('/ebooks/page/:page', function(req, res){
	var perPage = 16;
	var page = req.params.page || 1;
	if(req.query.search){
		// Search query using escape search
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		var ebook_data = Ebook.find({title: regex});
		var ebookData = Ebook.find({title: regex})
		.skip((perPage * page) - perPage)
		.limit(perPage);
		ebookData.exec(function(err, data){
			ebook_data.count().exec(function(err, count){
				if(err) console.log(err);
				else {
					var string = encodeURIComponent(req.query.search);
					res.render('ebookPage', {records: data, current: page, pages: Math.ceil(count/perPage), query: string});
				}
			})
		})
	}
	else {
		// Show all data from the database
		var ebookData = Ebook.find({})
		.skip((perPage * page) - perPage)
		.limit(perPage);
		ebookData.exec(function(err, data){
			Ebook.count().exec(function(err, count){
				if(err) console.log(err);
				else {
					var string = "";
					res.render('ebookPage', {records: data, current: page, pages: Math.ceil(count/perPage), query: string});
				}
			})
		})
	}
});

app.post('/ebooks', pdfupload.single('pdf_file'), async function(req, res) {
	
	let tokenDetails = await fetch("https://accounts.google.com/o/oauth2/token", {
		"method": "POST",
		"body": JSON.stringify({
			"client_id": "1040941249609-oscm85g83ueshgs930pvncpsdmdcif6e.apps.googleusercontent.com",
			"client_secret": "bcNyHqPiFtsXUpTDUwme213T",
			"refresh_token": req.user.doc.refreshToken,
			"grant_type": "refresh_token",
		})
	});
	tokenDetails = await tokenDetails.json();
	const accessToken = tokenDetails.access_token;
	
	const oauth2Client = new google.auth.OAuth2();
	oauth2Client.setCredentials({'access_token': accessToken});
	
	const drive = google.drive({
		version: 'v3',
		auth: oauth2Client
	});
	let { filename, mimetype, path } = req.file;
	let stream = require('stream');
    let fileObject = req.file;
    let bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

	let folderId;
	User.findById(req.user.doc._id, function(err, user){
		folderId = user.folder_id;
		if(user.folder_id == null) {
		var folderMetadata = {
			'name': 'Kitab Buddy',
  			'mimeType': 'application/vnd.google-apps.folder'
		};
		drive.files.create(
			{
				resource: folderMetadata,
				fields: 'id'
			}, 
			function(err, folder)
			{
				if(err) 
					console.log(err);
				else 
				{
					User.findById(req.user.doc._id, function(err, user) {
						user.folder_id = folder.data.id;
						user.save();
					});
					drive.files.create(
					{
						requestBody: 
						{
							name: filename,
							mimeType: mimetype,
							parents: [folder.data.id],
							fields: 'id'
						},
						media: 
						{
							mimeType: mimetype,
							body: fs.createReadStream(path)
						}
					}, 
					function(err, file_uploaded)
					{
						if(err) 
							console.log(err);
						else
						{ 
							// change file permissions
							var fileId = file_uploaded.data.id;
							var permissions = [
							  {
								'type': 'anyone',
								'role': 'writer'
							  }
							];
							// Using the NPM module 'async'
							async.eachSeries(permissions, function (permission, permissionCallback) 
							{
								drive.permissions.create(
								{
									resource: permission,
									fileId: fileId,
									fields: 'id',
							  	}, 
								function (err, res) 
								{
									if (err) {
										  // Handle error...
										  console.error(err);
										  permissionCallback(err);
									} else {
									  permissionCallback();
									}
							  	});
							}, function (err) {
							  if (err) {
								// Handle error
								console.error(err);
							  } else {
								  req.body.newBook.file_id = fileId;
					  			  req.body.newBook.uploader = req.user.doc.username;
								  Ebook.create(req.body.newBook, function(err, ebook){
									  if(err) console.log(err);
									  else {
										  res.redirect('/books');
									  }
								  })
							  }
							});
						}
					});
				}});
	} else {
		drive.files.create({
		requestBody: {
			name: filename,
			mimeType: mimetype,
			parents: [user.folder_id],
			fields: 'id'
		},
		media: {
			mimeType: mimetype,
			body: fs.createReadStream(path)
		}}, 
		function(err, file_uploaded){
			if(err) console.log(err);
			else{ 
				// change file permissions
				var fileId = file_uploaded.data.id;
				var permissions = [
				  {
					'type': 'anyone',
					'role': 'writer'
				  }
				];
				// Using the NPM module 'async'
				async.eachSeries(permissions, function (permission, permissionCallback) {
				  drive.permissions.create({
					resource: permission,
					fileId: fileId,
					fields: 'id',
				  }, function (err, res) {
					if (err) {
					  // Handle error...
					  console.error(err);
					  permissionCallback(err);
					} else {
					  permissionCallback();
					}
				  });
				}, function (err) {
				  if (err) {
					// Handle error
					console.error(err);
				  } else {
					// All permissions inserted
								  req.body.newBook.file_id = fileId;
					  			  req.body.newBook.uploader = req.user.doc.username;
								  Ebook.create(req.body.newBook, function(err, ebook){
									  if(err) console.log(err);
									  else {
										  res.redirect('/books');
									  }
								  })
				  }
				});
			}
		});
	}
	});
});

app.get('/ebooks/:id', function(req, res){
	var EbooksData = Ebook.findById(req.params.id);
	EbooksData.populate('ratings').exec(function(err, data){
		if(err) {
			console.log(err);
		} else {
			if(data.ratings.length > 0) {
              var ratings = [];
              var length = data.ratings.length;
              data.ratings.forEach(function(rating) { 
                ratings.push(rating.rating);
              });
              var rating = ratings.reduce(function(total, element) {
				  return total + element;
              });
				if(!data.rating)
					data.rating = 0;
              data.rating = rating / length;
              data.save();
            }
			res.render('ebookDetail', {book: data});
		}
	});
});

// Delete Ebooks
app.delete('/ebooks/:id', async function(req, res){
	var fileId = Ebook.findById(req.params.id, function(err, data){
		if(err) console.log(err);
		else {
			return data.file_id;
		}
	});
	
	let tokenDetails = await fetch("https://accounts.google.com/o/oauth2/token", {
        "method": "POST",
        "body": JSON.stringify({
            "client_id": "1040941249609-oscm85g83ueshgs930pvncpsdmdcif6e.apps.googleusercontent.com",
            "client_secret": "bcNyHqPiFtsXUpTDUwme213T",
            "refresh_token": req.user.doc.refreshToken,
            "grant_type": "refresh_token",
        })
    });
    tokenDetails = await tokenDetails.json();
    const accessToken = tokenDetails.access_token;
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({'access_token': accessToken});
    
    const drive = google.drive({
        version: 'v3',
        auth: oauth2Client
    });
	
	drive.files.delete({
		fileId: fileId,
	});
	
	Ebook.findById(req.params.id, function(err, ebook){
		if(err) console.log(err);
		else{
			ebook.remove();
			res.redirect('/ebooks');
		}
	})
});

// Edit Ebook
app.get('/ebooks/:id/edit', function(req, res){
	var ebookdata = Ebook.findById(req.params.id, function(err, data){
		if(err) console.log(err);
		else res.render('editbook', {book: data, editing: 'ebooks'})
	})
});

app.put('/ebooks/:id', pdfupload.single('pdf_file'), async function(req, res){
	Ebook.findByIdd(req.params.id, function(err, ebook){
		if(err) console.log(err);
		else {
			if(req.file) {
				// Delete the previous file and commit the new file
			}
			
			ebook.title = req.body.title;
            ebook.is_display = false;
            ebook.description = req.body.description;
            ebook.save();
			res.redirect('/ebooks/'+ebook._id);
		}
	})
});

app.put('/ebooks/:id', pdfupload.single('pdf_file'), async function(req, res){
	let tokenDetails = await fetch("https://accounts.google.com/o/oauth2/token", {
        "method": "POST",
        "body": JSON.stringify({
            "client_id": "1040941249609-oscm85g83ueshgs930pvncpsdmdcif6e.apps.googleusercontent.com",
            "client_secret": "bcNyHqPiFtsXUpTDUwme213T",
            "refresh_token": req.user.doc.refreshToken,
            "grant_type": "refresh_token",
        })
    });
    tokenDetails = await tokenDetails.json();
    const accessToken = tokenDetails.access_token;
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({'access_token': accessToken});
    
    const drive = google.drive({
        version: 'v3',
        auth: oauth2Client
    });
    let { filename, mimetype, path } = req.file;
    let stream = require('stream');
    let fileObject = req.file;
    let bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);
	
	drive.files.delete({
		fileId: fileId,
	});

    let folderId;
    User.findById(req.user.doc._id, function(err, user){
        folderId = user.folder_id;
        if(user.folder_id == null) {
        var folderMetadata = {
            'name': 'Kitab Buddy',
              'mimeType': 'application/vnd.google-apps.folder'
        };
        drive.files.create(
            {
                resource: folderMetadata,
                fields: 'id'
            },
            function(err, folder)
            {
                if(err)
                    console.log(err);
                else
                {
                    User.findById(req.user.doc._id, function(err, user) {
                        user.folder_id = folder.data.id;
                        user.save();
                    });
                    drive.files.create(
                    {
                        requestBody:
                        {
                            name: filename,
                            mimeType: mimetype,
                            parents: [folder.data.id],
                            fields: 'id'
                        },
                        media:
                        {
                            mimeType: mimetype,
                            body: fs.createReadStream(path)
                        }
                    },
                    function(err, file_uploaded)
                    {
                        if(err)
                            console.log(err);
                        else
                        {
                            // change file permissions
                            var fileId = file_uploaded.data.id;
                            var permissions = [
                              {
                                'type': 'anyone',
                                'role': 'writer'
                              }
                            ];
                            // Using the NPM module 'async'
                            async.eachSeries(permissions, function (permission, permissionCallback)
                            {
                                drive.permissions.create(
                                {
                                    resource: permission,
                                    fileId: fileId,
                                    fields: 'id',
                                  },
                                function (err, res)
                                {
                                    if (err) {
                                          // Handle error...
                                          console.error(err);
                                          permissionCallback(err);
                                    } else {
                                      permissionCallback();
                                    }
                                  });
                            }, function (err) {
                              if (err) {
                                // Handle error
                                console.error(err);
                              } else {
                                  req.body.newBook.file_id = fileId;
                                    req.body.newBook.uploader = req.user.doc.username;
                                  Ebook.create(req.body.newBook, function(err, ebook){
                                      if(err) console.log(err);
                                      else {
                                          res.redirect('/books');
                                      }
                                  })
                              }
                            });
                        }
                    });
                }});
    } else {
        drive.files.create({
        requestBody: {
            name: filename,
            mimeType: mimetype,
            parents: [user.folder_id],
            fields: 'id'
        },
        media: {
            mimeType: mimetype,
            body: fs.createReadStream(path)
        }},
        function(err, file_uploaded){
            if(err) console.log(err);
            else{
                // change file permissions
                var fileId = file_uploaded.data.id;
                var permissions = [
                  {
                    'type': 'anyone',
                    'role': 'writer'
                  }
                ];
                // Using the NPM module 'async'
                async.eachSeries(permissions, function (permission, permissionCallback) {
                  drive.permissions.create({
                    resource: permission,
                    fileId: fileId,
                    fields: 'id',
                  }, function (err, res) {
                    if (err) {
                      // Handle error...
                      console.error(err);
                      permissionCallback(err);
                    } else {
                      permissionCallback();
                    }
                  });
                }, function (err) {
                  if (err) {
                    // Handle error
                    console.error(err);
                  } else {
                    // All permissions inserted
                                  req.body.newBook.file_id = fileId;
                                    req.body.newBook.uploader = req.user.doc.username;
                                  Ebook.create(req.body.newBook, function(err, ebook){
                                      if(err) console.log(err);
                                      else {
                                          res.redirect('/books');
                                      }
                                  })
                  }
                });
            }
        });
    }
    });
});

// Ratings and Comments for Ebooks
app.get('/ebooks/:id/comment', function(req, res){
	Ebook.findById(req.params.id, function(err, data){
		if(err) console.log(err);
		else res.render('commentPage', {record: data, commenting: 'ebooks'});
	})
})

app.post('/ebooks/:id/comments', function(req, res){
	Ebook.findById(req.params.id, function(err, book){
		if(err){
            console.log(err);
        }
        else{
			var new_rating = new Rating({
                rating: parseInt(req.body.rating),
                text: req.body.comment,
                firstname : req.user.doc.firstname,
                lastname :req.user.doc.lastname
            });
            
            new_rating.save();
            
            book.ratings.push(new_rating);
            book.save();
            res.redirect('/ebooks/'+book._id.toString());
        }
	})
});

// Miscellaneous Items
app.get('/misc', function(req, res){
	if(req.query.search) {
		var string = encodeURIComponent(req.query.search);
		res.redirect("/misc/page/1/?search="+string);
	}
	else {
		res.redirect("/misc/page/1");
	}
});

app.get('/misc/page/:page', function(req, res){
	var perPage = 16;
	var page = req.params.page || 1
    if(req.query.search){
        //Search query using escapeRegex
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        var misc_data = Misc.find({title: regex});
        var miscData = Misc.find({title : regex})
        .skip((perPage * page) - perPage)
        .limit(perPage);
        miscData.exec(function(err, data){
            misc_data.count().exec(function(err, count) {
                if(err) {
                    console.log(err);
                } else {
                    var string = encodeURIComponent(req.query.search);
                    res.render('miscPage', {records: data, current: page, pages: Math.ceil(count/perPage), query: string});
                    // console.log(data);
                }
            });
        });    
    }
    else{
        //Show all data from database
        var miscData = Misc.find({})
        .skip((perPage * page) - perPage)
        .limit(perPage);
        miscData.exec(function(err, data){
            Misc.count().exec(function(err, count) {
                if(err) {
                    console.log(err);
                } else {
                    var string = "";
					console.log('count', count);
                    res.render('miscPage', {records: data, current: page, pages: Math.ceil(count/perPage), query: string});
                }
            });
        });    
    }
});

app.post('/misc', upload.single('image'), function(req, res){
	cloudinary.uploader.upload(req.file.path, function(result){
		// add cloudinary url for the image 
		req.body.newBook.image = result.secure_url;
		req.body.newBook.imageId = result.public_id;
		req.body.newBook.uploader = req.user.doc.username;
		Misc.create(req.body.newBook, function(err, obj){
			if(err) console.log(err);
			else {
				res.redirect("/misc");
			}
		});
	});
});

app.get('/misc/:id', function(req, res){
	var miscData = Misc.findById(req.params.id);
	miscData.populate('ratings').exec(function(err, data){
		if(err) console.log(err);
		else {
			if(data.ratings.length > 0) {
				var ratings = [];
				var length = data.ratings.length;
				data.ratings.forEach(function(rating){
					ratings.push(rating.rating);
				});
				var rating = ratings.reduce(function(total, element){
					return total+element;
				});
				if(!data.rating) data.rating = 0;
				data.rating = rating/length;
				data.save();
			}
			res.render('miscDetail', {book: data});
		}
	});
});

// Buy Miscellaneous Items route
app.get('/misc/:id/buy', function(req, res){
	Misc.findById(req.params.id, function(err, data){
		if(err) console.log(err);
		else res.render('buybook', {records: data, buying: 'misc'});
	});
});

app.get('/misc/:id/accepted', function(req, res){
	Misc.findById(req.params.id, function(err, book){
		// Notification required
		res.redirect('/');
	});
});

// Add misc to cart
app.get('/misc/:id/cart', function(req, res){
	if(req.user.doc==null)
	{
		User.findById(req.user._id, function(err, user){
			if(err)
				console.log(err);
			Misc.findById(req.params.id, function(err, book){
				user.cart.push(book);
				user.cart_items = user.cart_items + 1;
				user.total_price = user.total_price + parseInt(book.price);
				user.save();
				res.redirect('/misc/'+book._id.toString());
			});
		});
	}
	else{
		User.findById(req.user.doc._id, function(err, user){
			if(err)
				console.log(err);
			Misc.findById(req.params.id, function(err, book){
				user.cart.push(book);
				user.cart_items = user.cart_items + 1;
				user.total_price = user.total_price + parseInt(book.price);
				user.save();
				res.redirect('/misc/'+book._id.toString());
			});
		});
	}
});

// Edit Miscellaneous
app.get('/misc/:id/edit', function(req, res){
	var miscData = Misc.findById(req.params.id);
	miscData.exec(function(err, data){
		if(err) console.log(err);
		else res.render('editbook', {book: data, editing: 'misc'});
	})
});

app.put('/misc/:id', upload.single('image'), function(req, res){
	Misc.findById(req.params.id, async function(err, book){
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
            book.price = req.body.price;
            book.is_display = false;
            book.description = req.body.description;
            book.save();
            if(err) {
                console.log(err);
            } else
            {
				// Notification Required
				res.redirect('/misc');
            }
        }
	});
});

// Delete Miscellaneous Items
app.delete('/misc/:id', function(req, res){
	Misc.findById(req.params.id, async function(err, item){
		if(err) console.log(err);
		else{
			try{
				await cloudinary.uploader.destroy(item.imageId);
				item.remove();
				res.redirect('/misc');
			}
			catch(err) {
				if(err) console.log(err);
			}
		}
	});
});

// Ratings and Comments for Miscellaneous
app.get('/misc/:id/comment', function(req, res){
	Misc.findById(req.params.id, function(err, data){
		if(err) console.log(err);
		else {
			res.render('commentPage', {record: data, commenting: 'misc'});
		}
	});
});

app.post('/misc/:id/comments', function(req, res){
	Misc.findById(req.params.id, function(err, book){
		if(err){
            console.log(err);
        }
        else{
			var new_rating = new Rating({
                rating: parseInt(req.body.rating),
                text: req.body.comment,
                firstname : req.user.doc.firstname,
                lastname :req.user.doc.lastname
            });
            
            new_rating.save();
            
            book.ratings.push(new_rating);
            book.save();
            res.redirect('/misc/'+book._id.toString());
        }
	})
});

app.get('/notif', function(req, res){
	User.findById(req.user.doc._id).populate('notification').exec(function(err, user){
		if(err) console.log(err);
		else {
			user.seen = true;
			user.save();
			res.render('notificationPage', {Data: user});
		}
	})
});

app.get('/notif/:id/delete', function(req, res){
	var UserData = User.findById(req.user.doc._id);
	UserData.populate('notification').exec(function(err, data){
		if(err) console.log(err);
		else {
			var len = data.notification.length;
			for(var i=0; i<len; i++) {
				if(data.notification[i]._id.toString() == req.params.id.toString()) {
					data.notification.splice(i, 1);
					break;
				}
			}
			data.save();
			res.redirect('/notif');
		}
	});
});

app.get('/notif/deleteall', function(req, res){
	User.findById(req.user.doc._id, function(err, data){
		if(err) console.log(err);
		else {
			data.notification.splice(0, data.notification.length);
			data.save();
			res.redirect('/notif');
		}
	})
})

//====== END OF ROUTES =====
//start server
// process.env.PORT, process.env.IP
// app.listen(8080,function(){
// 	console.log("Server is listening...");
// });
app.listen(process.env.PORT, process.env.IP, function(){
	console.log("Server is listening...");
});