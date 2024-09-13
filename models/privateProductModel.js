import mongoose from "mongoose";

const privateProductSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            require: [true, "Title is required"],
        },
        description: {
            type: String,
            require: [true, "Description is required"],
        },
        pImage: {
            type: String,
            require: [true, "Image is required"],
        },
        images: {
            type: Array,
        },
        slug: {
            type: String,
            unique: true
        },
        metaDescription: {
            type: String,
        },
        metaTitle: {
            type: String,
        },
        metaKeywords: {
            type: String,
        },
        regularPrice: {
            type: Number,
        },
        salePrice: {
            type: Number,
        },
        Status: {
            type: Number,
        },
        variations: {
            type: Object,
        },
        store: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Privatestore'
        }],
    },
    { timestamps: true }
);

const privateProductModel = mongoose.model("privateProduct", privateProductSchema);

export default privateProductModel;