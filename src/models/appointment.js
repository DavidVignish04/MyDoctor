const { mongoose } = require("../config");
const appointmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  doctor: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "confirmed"
  }

});

module.exports = mongoose.model('Appointment', appointmentSchema);
