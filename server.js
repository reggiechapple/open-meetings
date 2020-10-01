const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const socket = require("socket.io");
const MongoStore = require('connect-mongo')(session);
// const dotenv = require("dotenv");
const flash = require("connect-flash");
const RTCMultiConnectionServer = require('rtcmulticonnection-server');
const morgan = require("morgan");

const port = process.env.PORT || 3000;
const MONGODB_URI = "mongodb://localhost:27017/omdb";

const rootRoutes = require("./routes/root");

const app = express();

// Set view engine to ejs so that template files will be ejs files
app.set("view engine", "ejs");

// Setup logging
app.use(morgan("tiny"));

// Setup sessions
app.use(session({
    store: new MongoStore({
        url: MONGODB_URI
    }),
    secret: "secretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 * 2 // two weeks
    }
}));

// Set up passport for authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Setup body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Setup static directories
app.use(express.static("public"));
app.use(express.static("node_modules"));

// Set up flash (alerts)
app.use(flash());

// Connect to MongoDB database
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Passing variables to template files
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.login = req.isAuthenticated();
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});


// Setup routes
app.use("/", rootRoutes);

// Setup HTTP server
const server = app.listen(port, () => {
    console.log("App is running on port " + port);
});

// Setup websocket server
const io = socket(server);
io.on("connection", function(socket) {
    // Setup WebRTC signalling server
    RTCMultiConnectionServer.addSocket(socket);
});

