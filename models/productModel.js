import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        p_id: {
            type: Number,
            require: [true, "product id is required"],
            unique: true
        },
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
            default: 1,
        },
        stock: {
            type: Number,
        },
        variations: {
            type: Object,
        },
        sku: {
            type: String,
        },
        Barcode: {
            type: Number,
        },
        Category: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }], // Define Category as an array of ObjectIds
    },
    { timestamps: true }
);

const productModel = mongoose.model("product", productSchema);

// Method to delete products within a range of p_id
productModel.deleteProductsByRange = async (startId, endId) => {
    try {
        await productModel.deleteMany({ p_id: { $gte: startId, $lte: endId } });
        console.log(`Products with p_id from ${startId} to ${endId} deleted successfully.`);
    } catch (error) {
        console.error("Error deleting products:", error);
        throw error;
    }
};

export default productModel;
