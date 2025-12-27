require("dotenv").config(); // must be first

const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");

// DB connection (runs once)
require("./config");

const User = require("./models/user");
const Appointment = require("./models/appointment");

const app = express();

app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true
}));


const doctors = [
            {
                name: "Dr. Sarah Johnson",
                specialty: "Cardiology",
                workingHours: {
                    Monday: ["2:00 PM", "4:00 PM"],
                    Tuesday: ["2:00 PM", "5:00 PM"],
                    Wednesday: ["2:00 PM", "5:00 PM"],
                    Thursday: ["2:00 PM", "5:00 PM"],
                    Friday: ["2:00 PM", "4:00 PM"]
                },
                rating: 4.5,
                reviews: 128,
                availability: "Available Today"
            },
            {
                name: "Dr. Siva Shankar",
                specialty: "Cardiology",
                workingHours: {
                    Monday: ["9:00 AM", "12:00 PM"],
                    Thursday: ["9:00 AM", "12:00 PM"],
                    Friday: ["10:00 AM", "12:00 PM"]
                },
                rating: 4.4,
                reviews: 149,
                availability: "Available Today"
            },
            {
                name: "Dr. Michael Chen",
                specialty: "Pediatrics",
                workingHours: {
                    Monday: ["2:00 PM", "4:00 PM"],
                    Tuesday: ["2:00 PM", "4:00 PM"],
                    Wednesday: ["2:00 PM", "6:00 PM"],
                    Thursday: ["2:00 PM", "4:00 PM"],
                    Saturday: ["2:00 PM", "1:00 PM"]
                },
                rating: 4.9,
                reviews: 204,
                availability: "Limited Availability"
            },
            {
                name: "Dr. Emily Rodriguez",
                specialty: "Dermatology",
                workingHours: {
                    Monday: ["3:00 PM", "5:00 PM"],
                    Tuesday: ["3:00 PM", "5:00 PM"],
                    Wednesday: ["3:00 PM", "5:00 PM"],
                    Friday: ["3:00 PM", "5:00 PM"]
                },
                rating: 4.7,
                reviews: 93,
                availability: "Available Today"
            },
            {
                name: "Dr. James Wilson",
                specialty: "Neurology",
                workingHours: {
                    Tuesday: ["10:00 AM", "12:00 PM"],
                    Wednesday: ["10:00 AM", "12:00 PM"],
                    Thursday: ["10:00 AM", "12:00 PM"],
                    Friday: ["9:00 AM", "12:00 PM"]
                },
                rating: 4.8,
                reviews: 167,
                availability: "Limited Availability"
            },
            {
                name: "Dr. Lisa Thompson",
                specialty: "Orthopedics",
                workingHours: {
                    Monday: ["8:00 AM", "11:00 PM"],
                    Tuesday: ["8:00 AM", "11:00 PM"],
                    Thursday: ["8:00 AM", "11:00 PM"],
                    Friday: ["8:00 AM", "11:00 PM"]
                },
                rating: 4.6,
                reviews: 112,
                availability: "Available Today"
            },
            {
                name: "Dr. Robert Kim",
                specialty: "Gastroenterology",
                workingHours: {
                    Monday: ["9:00 AM", "12:00 PM"],
                    Tuesday: ["9:00 AM", "12:00 PM"],
                    Wednesday: ["9:00 AM", "12:00 PM"],
                    Thursday: ["9:00 AM", "12:00 PM"]
                },
                rating: 4.5,
                reviews: 78,
                availability: "Available Today"
            },
            {
                name: "Dr. Amanda Patel",
                specialty: "Ophthalmology",
                workingHours: {
                    Monday: ["9:00 AM", "12:00 PM"],
                    Wednesday: ["9:00 AM", "12:00 PM"],
                    Thursday: ["9:00 AM", "12:00 PM"],
                    Friday: ["9:00 AM", "12:00 PM"]
                },
                rating: 4.9,
                reviews: 145,
                availability: "Limited Availability"
            }
        ];

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use((req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
});


// use ejs as view engine
app.set("view engine","ejs");
app.set('views',path.join(__dirname,'../views'));

app.get('/',(req,res)=>{
    res.render("login");
});
app.get('/signup',(req,res)=>{
    res.render("signup");
});
app.get('/home',(req,res)=>{
    res.render('home');
});
app.get('/login',(req,res)=>{
    res.render('login');
});
app.get('/doctors',(req,res)=>{
    res.render('doctors');
});
app.get('/specialties',(req,res)=>{
    res.render('specialties');
});
app.get("/bookings", async (req, res) => {
  try {
    const appointments = await Appointment.find({});
    res.render("bookings", { appointments });
  } catch (err) {
    console.error("REAL ERROR:", err);
    res.status(500).send("Error fetching appointments");
  }
});

app.post("/book-appointment", async (req, res) => {
  const { doctor, date, time, reason } = req.body;

  await Appointment.create({
    name: req.session.username,
    doctor,
    date,
    time,
    reason
  });

  console.log("Appointment saved.");
  res.redirect("/home?booked=true");
});


app.get('/booking', (req, res) => {
    const doctorName = req.query.doctor;
    // find that doctor from your doctors list
    const doctor = doctors.find(d => d.name === doctorName);
    if (!doctor) {
        return res.send("Doctor not found");
    }
    res.render('booking', { doctor });
});
app.post("/appointments/:id/cancel", async (req, res) => {
    try {
        const id = req.params.id;

        // delete appointment status in DB
        await Appointment.findByIdAndDelete(id);

        // Redirect back to bookings page
        res.redirect("/bookings?canceled=true");
    } catch (error) {
        console.error("Cancel error:", error);
        res.redirect("/bookings?canceled=false");
    }
});


app.post('/signup', async (req, res) => {
    try {
        const { name, mail, password } = req.body;

        // check if user exists
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).send("User already exists");
        }

        // HASH THE PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // SAVE USER
        const newUser = await User.create({
            name,
            mail,
            password: hashedPassword
        });

        console.log("User created:", newUser);

        return res.redirect('/');
    }catch (err) {
        console.error(err);
        res.status(500).send("signup error!!");
    }
});

app.post("/login", async (req, res) => {
  const { name, password } = req.body;

  const user = await User.findOne({ name });
  console.log("USER FROM DB:", user);

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  console.log("PASSWORD IN DB:", user.password);

  const isMatch = await bcrypt.compare(password, user.password);
  console.log("BCRYPT RESULT:", isMatch);

  if (!isMatch) {
    return res.status(400).json({ error: "Invalid password" });
  }
  req.session.username = user.name;

  console.log("login success!!");
  return res.status(200).json({ message: "Login successful" });
});

app.get("/debug-users", async (req, res) => {
    const users = await User.find({});
    console.log("ALL USERS:", users);
    res.send(users);
});

const port=5000;
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})