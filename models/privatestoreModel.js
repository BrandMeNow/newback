import mongoose from "mongoose";

const privatestoreSchema = mongoose.Schema({
    companyLogo: {
        type: String,
        required: true,
    },
    companyName: {
        type: String,
        required: true,
    },
    metaTitle: {
        type: String,
    },
    metaDescription: {
        type: String,
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'privateProduct',
    },],
    passwordStatus: {
        type: String,
        default: false
    },
    password: {
        type: String,
    },
    status: {
        type: String,
        default: true
    },
},
    { timestamps: true }
);

const privatestoreModel = mongoose.model('Privatestore', privatestoreSchema);

export default privatestoreModel;