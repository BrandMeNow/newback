import mongoose from "mongoose";

const adminSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, 'email is Required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'email is Required']
    }, token: {
        type: String,
    }
})

const adminModel = mongoose.model('Admin', adminSchema);

export default adminModel;