const dotenv = require('dotenv')
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')

const saltRounds = 10;
dotenv.config()

const app = express()
app.set("view engine", "ejs")

app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(cookieParser())

app.set('trust proxy', 1)

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log("Connection Error for MongoDB", err))

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  secrets: [{
    type: String,
    trim: true,
    default: []
  }]
})
const User = mongoose.model("User", userSchema)

const isProd = process.env.NODE_ENV === 'production'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
}

function signToken(user) {
  return jwt.sign(
  {
    id: user._id,
    name: user.name,
    email: user.email
  },
  process.env.JWT_SECRET,
  {expiresIn: '7d'})
}

function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  next()
}

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.redirect('/login')
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    res.clearCookie('token', COOKIE_OPTIONS)
    return res.redirect('/login')
  }
}

app.get("/", (req, res) => {
  res.render("home")
})

app.get("/register", (req, res) => {
  res.render('register')
})

app.get("/login", (req, res) => {
  res.render("login")
})

app.post("/register", async (req, res) => {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;

    if (!emailRegex.test(req.body.email)) {
      return res.send("Invalid email format")
    }
    if (!passRegex.test(req.body.password)) {
      return res.send("Password must be minimum 6 characters, including uppercase, lowercase and a number")      
    }

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds)
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    })
    await newUser.save();
    const token = signToken(newUser)
    res.cookie('token', token, COOKIE_OPTIONS)
    res.redirect('/login')
  } catch (err) {
    res.send("Error during registration" + err.message)
  }
})

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const foundUser = await User.findOne({email: email.toLowerCase()})
    if (!foundUser) {
      return res.send("No account found with this email")
    }
    const passMatch = await bcrypt.compare(password, foundUser.password)
    if (!passMatch) {
      return res.send("Invalid email or password")
    }
    const token = signToken(foundUser)
    res.cookie("token", token, COOKIE_OPTIONS)
    res.redirect("/secrets")
  } catch (error) {
    console.log(error)
    res.send('Error Logging in')
  }
})

app.get('/submit', requireAuth, noCache, (req, res) => {
  res.render('submit', {user: req.user})
})

app.post('/submit', requireAuth, noCache, async (req, res) => {
  try {
    const { secret } = req.body
    if (!secret || !secret.trim()) {
      return res.send("Secret cannot be empty")
    }
    await User.findByIdAndUpdate(
      req.user.id,
      {$push: {secrets: secret.trim()}}
    )
    res.redirect("/secrets")
  } catch (err) {
    res.send(err)
  }
})

app.get('/secrets', requireAuth, noCache, async (req, res) => {
  try {
    const userWithSecret = await User.find(
      {secrets: {$exists: true, $ne: []} },
      { name: 1, secrets: 1 }
    ).lean()
    res.render("secrets", {
      user: req.user,
      userWithSecret
    })
  } catch (err) {
    console.log(err)
  }
})

app.post("/delete", requireAuth, noCache, async (req, res) => {
  try {
    const secretToDelete = req.body.secret
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId,
      { $pull: {secrets: secretToDelete}}
    )
    res.redirect("/secrets")
  } catch (error) {
    console.log(error)
  }
})

app.get('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS)
  res.redirect("/login")
})


app.listen(5000, () => {
  console.log("Server started at http://localhost:5000")
})