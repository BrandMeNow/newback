
import adminModel from "../models/adminModel.js";
import bcrypt from 'bcrypt'
import galleryModel from "../models/galleryModel.js";
import blogModel from "../models/blogModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import attributeModel from "../models/attributeModel.js";
import tagModel from "../models/tagModel.js";
import privateProductModel from "../models/privateProductModel.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import homeLayoutModel from "../models/homeLayoutModel.js";
import nodemailer from 'nodemailer';
import pageModel from "../models/pageModel.js";
// image function 

import multer from 'multer';
import { unlink } from 'fs/promises';
import imageSize from "image-size";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

import { dirname } from 'path';

import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import homeModel from "../models/homeModel.js";
import privatestoreModel from "../models/privatestoreModel.js";
import stripe from 'stripe';

import dotenv from 'dotenv';
import folderModel from "../models/folderModel.js";
import { stringify } from "csv-stringify";


const stripeInstance = stripe(process.env.stripe_api);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Define the destination folder where uploaded images will be saved
        cb(null, "public/uploads/");
    },
    filename: function (req, file, cb) {
        // Define the filename for the uploaded image
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});

const upload = multer({ storage: storage });

export const SignupAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        //validation
        if (!email || !password) {
            return res.status(400).send({
                success: false,
                message: 'please fill all fields'
            })
        }

        const existingadmin = await adminModel.findOne({ email })
        if (existingadmin) {
            return res.status(401).send({
                success: false,
                message: 'admin Already exist'
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        // save new admin
        const admin = await new adminModel({ email, password: hashedPassword })
        await admin.save();
        return res.status(201).send({
            success: true,
            message: 'admin created sucessfully',
            admin,
        });
    } catch (error) {
        return res.status(500).send
            ({
                message: `error on signup ${error}`,
                success: false,
                error
            })

    }

}

export const Adminlogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({
                success: false,
                message: 'Please fill all fields'
            });
        }
        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(200).send({
                success: false,
                message: 'Email is not registered',
                admin,
            });
        }
        // Password check
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).send({
                success: false,
                message: 'Password is incorrect',
                admin,
            });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET);

        // Set token in cookie
        res.cookie("jwt", token, { httpOnly: true });

        // Send success response
        return res.status(200).send({
            success: true,
            message: 'Login successfully',
            admin,
        });
    } catch (error) {
        return res.status(500).send({
            message: `Error on login: ${error}`,
            success: false,
            error
        });
    }
};


function formatFileSize(bytes) {
    const kilobytes = bytes / 1024;
    if (kilobytes < 1024) {
        return kilobytes.toFixed(2) + ' KB';
    }
    const megabytes = kilobytes / 1024;
    return megabytes.toFixed(2) + ' MB';
}


export const handleImageUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file uploaded" });
        }

        const uploadedImage = req.file;
        const imageName = uploadedImage.originalname;
        const filename = uploadedImage.filename;

        const fileSizeFormatted = formatFileSize(uploadedImage.size); // Assuming this function is defined elsewhere
        const dimensions = imageSize(uploadedImage.path); // Assuming this function is defined elsewhere
        const width = dimensions.width;
        const height = dimensions.height;
        const title = imageName.substring(0, imageName.lastIndexOf("."));

        const filePathAndName = `${filename}`;

        let newImage;
        if (!req.query.id) { // Check if id is not provided or undefined
            newImage = new galleryModel({
                title: title,
                filePath: filePathAndName,
                fileType: uploadedImage.mimetype,
                fileSize: fileSizeFormatted,
                dimensions: `${width}x${height}`,
            });
        } else {
            newImage = new galleryModel({
                title: title,
                filePath: filePathAndName,
                fileType: uploadedImage.mimetype,
                fileSize: fileSizeFormatted,
                dimensions: `${width}x${height}`,
                folderId: req.query.id, // Use the provided id
            });
        }

        await newImage.save();

        res.status(200).json({ success: true, message: "Image uploaded successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }

};


export const handleCusImageUpload = async (req, res) => {

    try {
        const uploadedImage = req.file;
        const imageName = uploadedImage.originalname;
        const filename = uploadedImage.filename; // Get the filename from the req.file object

        const fileSizeFormatted = formatFileSize(uploadedImage.size);

        // Get image dimensions using the image-size library
        const dimensions = imageSize(uploadedImage.path);
        const width = dimensions.width;
        const height = dimensions.height;

        const title = imageName.substring(0, imageName.lastIndexOf('.'));

        const filePathAndName = `${filename}`;



        res.json({ imageUrl: filePathAndName });


    } catch (error) {
        // Handle errors here
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


export const getAllGalleryController = async (req, res) => {
    try {
        const gallery = await galleryModel.find({})
        if (!gallery) {
            return res.status(200).send
                ({
                    message: 'NO Gallery Find',
                    success: false,
                });
        }
        return res.status(200).send
            ({
                message: 'All Gallery List ',
                BlogCount: gallery.length,
                success: true,
                gallery,
            });

    } catch (error) {
        return res.status(500).send
            ({
                message: `error while getting Gallery ${error}`,
                success: false,
                error
            })
    }
}

export const deleteGalleryController = async (req, res) => {
    try {
        const image = await galleryModel.findById(req.params.id);


        if (!image) {
            return res.status(404).send({
                success: false,
                message: "Gallery not found",
            });
        }

        // Get the current module's file path
        const __filename = fileURLToPath(import.meta.url);

        // Get the current module's directory name
        const __dirname = dirname(__filename);

        // Construct the file path on the server
        const imagePath = path.join(__dirname, '../public/uploads', image.filePath);

        // Check if the file exists before attempting to delete it
        try {
            await fs.unlink(imagePath); // Delete the file asynchronously
        } catch (error) {
            console.error("Error deleting file:", error);
        }

        // Delete the gallery item from the database
        await galleryModel.findByIdAndDelete(req.params.id);


        return res.status(200).send({
            success: true,
            message: "Gallery Deleted!",
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr WHile Deleteing Gallery",
            error,
        });
    }
};


export const uploadImage = upload.single('image');



export const AddAdminFolderController = async (req, res) => {
    try {
        const { id } = req.query; // Access id from query parameters
        const { name } = req.body;

        // Validation
        if (!name) {
            return res.status(400).send({
                success: false,
                message: "Please Provide Folder name",
            });
        }

        let newFolder;
        if (id) {
            // Create a new category with the specified parent
            newFolder = new folderModel({ name, folderId: id });
        } else {
            // Create a new category without a parent
            newFolder = new folderModel({ name });
        }

        await newFolder.save();

        return res.status(201).send({
            success: true,
            message: "Folder Created!",
            newFolder,
        });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
            // Duplicate key error, i.e., folder name already exists
            return res.status(400).send({
                success: false,
                message: "Folder name already exists. Please choose a different name.",
            });
        }
        console.error("Error while creating Folder:", error);
        return res.status(500).send({
            success: false,
            message: "Error while creating Folder",
            error,
        });
    }
};


export const GetFolderIDAdmin = async (req, res) => {
    const { id } = req.params;

    try {
        const folder = await folderModel.findById(id);
        if (!folder) {
            return res.status(404).json({
                message: "Folder not found",
                success: false,
            });
        }
        return res.status(200).json({
            message: "Folder found by ID",
            success: true,
            folder,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error while getting folder: ${error.message}`,
            success: false,
            error: error.message,
        });
    }
};


export const GetFolderAdmin = async (req, res) => {
    try {
        const { id } = req.query;

        if (id) {
            // If id is provided, fetch both parent and child folders
            const [parentFolder, Folder] = await Promise.all([
                folderModel.findById(id).lean(), // Fetch parent folder
                folderModel.find({ folderId: id }).lean(), // Fetch child folders
            ]);

            const userId = req.params.id;



            if (!parentFolder) {
                return res.status(404).send({
                    message: "Parent Folder not found",
                    success: false,
                });
            }

            return res.status(200).send({
                message: "Parent and Child Folders found",
                success: true,
                parentFolder,
                Folder,
            });
        } else {
            // If id is not provided, fetch folders where folderId is empty
            const Folder = await folderModel.find({ folderId: null }).lean();

            return res.status(200).send({
                message: "Folders without Parent found",
                success: true,
                Folder,
            });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Error while getting folders ${error}`,
            success: false,
            error,
        });
    }
};



export const GetImageAdmin = async (req, res) => {
    try {
        const { id } = req.query;

        if (id) {

            // Find galleryModel items for the specified user ID
            const Gallery = await galleryModel.find({ folderId: id }).lean();

            if (!Gallery) {
                return res.status(400).send({
                    message: "Images not found",
                    success: false,
                });
            }

            return res.status(200).send({
                message: "images found by Id",
                success: true,
                Gallery,
            });
        } else {
            // If id is not provided, fetch folders where folderId is empty
            const Gallery = await galleryModel.find({ folderId: null }).lean();

            return res.status(200).send({
                message: "All images found",
                success: true,
                Gallery,
            });
        }
    } catch (error) {
        return res.status(500).send({
            message: `Error while getting images ${error}`,
            success: false,
            error,
        });
    }
};




export const UpdateFolderAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, folderId } = req.body;

        // Validation: Check if the name is empty
        if (!name || /^\s*$/.test(name)) {
            return res.status(400).json({
                success: false,
                message: "Name is required",
            });
        }

        // Check if the name already exists for another folder
        const existingFolder = await folderModel.findOne({ name });
        if (existingFolder && existingFolder._id.toString() !== id) {
            return res.status(400).json({
                success: false,
                message: "Folder name already exists. Please choose a different name.",
            });
        }

        let updateFields = {
            name,
            folderId,
        };

        const Folder = await folderModel.findByIdAndUpdate(id, updateFields, {
            new: true,
        });

        if (!Folder) {
            return res.status(404).json({
                message: "Folder not found",
                success: false,
            });
        }

        return res.status(200).json({
            message: "Folder updated successfully!",
            success: true,
            Folder,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error while updating Folder: ${error.message}`,
            success: false,
            error,
        });
    }
};


export const deleteFolderAdmin = async (req, res) => {
    try {
        await folderModel.findByIdAndDelete(req.params.id);

        return res.status(200).send({
            success: true,
            message: "Folder Deleted!",
        });
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr WHile Deleteing Folder",
            error,
        });
    }
};




export const AddAdminBlogController = async (req, res) => {
    try {
        const { title, description, image, metaTitle, slug, metaDescription, metaKeywords } = req.body;
        //validation
        if (!title) {
            return res.status(400).send({
                success: false,
                message: "Please Provide All Fields",
            });
        }

        const newBlog = new blogModel({ title, description, image, slug, metaTitle, metaDescription, metaKeywords });
        await newBlog.save();
        return res.status(201).send({
            success: true,
            message: "Blog Created!",
            newBlog,
        });
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Error WHile Creting blog",
            error,
        });
    }
}



export const AdmindeleteBlogController = async (req, res) => {
    try {
        const blog = await blogModel
            // .findOneAndDelete(req.params.id)
            .findByIdAndDelete(req.params.id)
        return res.status(200).send({
            success: true,
            message: "Blog Deleted!",
            blog
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr WHile Deleteing BLog",
            error,
        });
    }
};

export const AdmindeleteOrderController = async (req, res) => {
    try {
        await orderModel
            // .findOneAndDelete(req.params.id)
            .findByIdAndDelete(req.params.id)
        return res.status(200).send({
            success: true,
            message: " Order Deleted!",

        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr WHile Deleteing BLog",
            error,
        });
    }
};


export const AddAdminCategoryController = async (req, res) => {
    try {
        const { title, image, slug, description, metaTitle, metaDescription, metaKeywords, parent, status } = req.body;

        // Validation
        if (!title || !slug) {
            return res.status(400).send({
                success: false,
                message: "Please Provide All Fields",
            });
        }

        // Create a new category with the specified parent
        const newCategory = new categoryModel({ title, image, slug, description, metaTitle, metaDescription, metaKeywords, parent, status });
        await newCategory.save();

        return res.status(201).send({
            success: true,
            message: "Category Created!",
            newCategory,
        });
    } catch (error) {
        console.error("Error while creating category:", error);
        return res.status(400).send({
            success: false,
            message: "Error While Creating Category",
            error,
        });
    }
};



export const GetAllCategoriesByParentIdController = async (req, res) => {

    try {
        const { parentId } = req.params;

        // Check if parentId is undefined or null
        if (!parentId) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid parent ID.",
            });
        }

        // Call the recursive function to get all categories
        const categories = await getAllCategoriesByParentId(parentId);
        const MainCat = await categoryModel.findById(parentId).select('title').select('title').lean();

        const queryParameters = req.query; // Extract query parameters

        const filters = { Category: parentId }; // Apply parentId filter

        // Construct filters based on the query parameters (variations)
        Object.keys(queryParameters).forEach(param => {
            if (param !== 'Category') {
                // Split parameter values by comma if present
                const paramValues = queryParameters[param].split(',');

                // Check if there are multiple values for the parameter
                if (paramValues.length > 1) {
                    filters[`variations.${param}.${param}`] = { $all: paramValues };
                } else {
                    // If only one value, handle it as a single filter
                    filters[`variations.${param}.${param}`] = { $in: paramValues };
                }
            }
        });

        const products = await productModel.find(filters).select('_id').select('title').select('regularPrice').select('salePrice').select('pImage').select('variations').lean();

        const proLength = products.length;
        return res.status(200).json({
            success: true,
            categories,
            MainCat,
            products,
            proLength
        });
    } catch (error) {
        console.error("Error in GetAllCategoriesByParentIdController:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


export const GetAllCategoriesByuserController = async (req, res) => {
    try {
        const { parentId } = req.params;
        const { filter, price, page = 1, perPage = 2 } = req.query; // Extract filter, price, page, and perPage query parameters

        // Check if parentId is undefined or null
        if (!parentId) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid parent ID.",
            });
        }

        // Call the recursive function to get all categories
        const categories = await getAllCategoriesByParentId(parentId);
        const MainCat = await categoryModel
            .findById(parentId)
            .select("title")
            .lean();

        const filters = { Category: parentId }; // Initialize filters with parent category filter

        if (filter) {
            // Parse the filter parameter
            const filterParams = JSON.parse(filter);

            // Iterate through each parameter in the filter
            Object.keys(filterParams).forEach((param) => {
                // Split parameter values by comma if present
                const paramValues = filterParams[param].split(",");

                // Check if there are multiple values for the parameter
                if (paramValues.length > 1) {
                    filters[`variations.${param}.${param}`] = { $all: paramValues };
                } else {
                    // If only one value, handle it as a single filter
                    filters[`variations.${param}.${param}`] = { $in: paramValues };
                }
            });
        }

        // Check if price parameter is provided and not blank
        if (price && price.trim() !== "") {
            const priceRanges = price.split(","); // Split multiple price ranges by comma
            const priceFilters = priceRanges.map((range) => {
                const [minPrice, maxPrice] = range.split("-"); // Split each range into min and max prices
                return { salePrice: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) } };
            });

            // Add price filters to the existing filters
            filters.$or = priceFilters;
        }

        // Calculate skip value for pagination
        const skip = (page - 1) * perPage;

        // Fetch products based on filters with pagination
        const products = await productModel
            .find(filters)
            .select("_id title regularPrice salePrice pImage variations")
            .skip(skip)
            .limit(perPage)
            .lean();

        const Procat = { Category: parentId }; // Initialize filters with parent category filter
        const productsFilter = await productModel.find(Procat).select("_id regularPrice salePrice").lean();

        const proLength = products.length;
        return res.status(200).json({
            success: true,
            categories,
            MainCat,
            products,
            proLength,
            productsFilter,
        });
    } catch (error) {
        console.error("Error in GetAllCategoriesByParentIdController:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


export const getAllCategoriesByParentId = async (parentId) => {
    try {
        const categories = await categoryModel.find({ parent: parentId }).lean();;

        if (!categories || categories.length === 0) {
            return [];
        }

        const result = [];

        for (const category of categories) {
            const { _id, title, image /* other fields */ } = category;

            const categoryData = {
                _id,
                title, image,
                subcategories: await getAllCategoriesByParentId(_id), // Recursive call
            };

            result.push(categoryData);
        }

        return result;
    } catch (error) {
        console.error("Error while fetching categories:", error);
        throw error;
    }
};


export const AdmingetAllCategories = async () => {

    try {
        const categories = await categoryModel.find({ parent: { $exists: false } }).lean();;

        return categories;
    } catch (error) {
        console.error("Error while fetching top-level categories:", error);
        throw error;
    }
}



export const getAllcategoryFillAdmin = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1; // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
        const searchTerm = req.query.search || ''; // Get search term from the query parameters

        const skip = (page - 1) * limit;

        const query = {};
        if (searchTerm) {
            // If search term is provided, add it to the query
            query.$or = [
                { title: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive username search
                { slug: { $regex: searchTerm, $options: 'i' } },    // Case-insensitive email search
            ];
        }

        const totalCategory = await categoryModel.countDocuments();

        const Category = await categoryModel
            .find(query)
            .sort({ _id: -1 }) // Sort by _id in descending order
            .skip(skip)
            .limit(limit)
            .lean();

        if (!Category) {
            return res.status(200).send
                ({
                    message: 'NO category found',
                    success: false,
                });
        }
        return res.status(200).send
            ({
                message: 'All category list ',
                CategoryCount: Category.length,
                currentPage: page,
                totalPages: Math.ceil(totalCategory / limit),
                success: true,
                Category,
            });

    } catch (error) {
        return res.status(500).send
            ({
                message: `Error while getting category ${error}`,
                success: false,
                error
            })
    }
}

export const updateCategoryAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title, image, slug, description, metaTitle, metaDescription, metaKeywords, parent, status
        } = req.body;

        let updateFields = {
            title, image, slug, description, metaTitle, metaDescription, metaKeywords, parent, status,
        };


        const Category = await categoryModel.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        return res.status(200).json({
            message: 'Category Updated!',
            success: true,
            Category,
        });
    } catch (error) {
        return res.status(400).json({
            message: `Error while updating Category: ${error}`,
            success: false,
            error,
        });
    }
};

export const getCategoryIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const Category = await categoryModel.findById(id);
        if (!Category) {
            return res.status(200).send
                ({
                    message: 'Category Not Found By Id',
                    success: false,
                });
        }
        return res.status(200).json({
            message: 'fetch Single Category!',
            success: true,
            Category,
        });

    }
    catch (error) {
        return res.status(400).json({
            message: `Error while get Category: ${error}`,
            success: false,
            error,
        });
    }
}

export const deleteCategoryAdmin = async (req, res) => {
    try {

        await categoryModel.findByIdAndDelete(req.params.id);


        return res.status(200).send({
            success: true,
            message: "Employee Deleted!",
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr WHile Deleteing Employee",
            error,
        });
    }
};



export const AddAdminProduct = async (req, res) => {
    try {
        const { title, description, pImage, images, slug, metaDescription, metaTitle, regularPrice, salePrice, status, stock, variations, metaKeywords, Category, tag, sku, Barcode } = req.body;

        // Validation
        if (!title || !slug || !salePrice) {
            return res.status(400).send({
                success: false,
                message: "Please Provide All Fields",
            });
        }


        const lastProduct = await productModel.findOne().sort({ _id: -1 }).limit(1);
        if (typeof lastProduct.p_id === 'string') {
            lastProduct.p_id = parseFloat(lastProduct.p_id);
        }

        const lastProductId = lastProduct ? lastProduct.p_id : 0;

        // Calculate the auto-increment ID
        const p_id = lastProductId + 1;

        // Create a new category with the specified parent
        const newProduct = new productModel({ p_id, title, description, pImage, images, slug, metaDescription, metaTitle, regularPrice, salePrice, status, stock, variations, metaKeywords, Category, tag, sku, Barcode });
        await newProduct.save();

        return res.status(201).send({
            success: true,
            message: "Product Added Success!",
            newProduct,
        });
    } catch (error) {
        console.error("Error while creating category:", error);
        return res.status(400).send({
            success: false,
            message: "Error While Adding Product",
            error,
        });
    }
};



export const getAllProductFillAdmin = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1; // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
        const searchTerm = req.query.search || ''; // Get search term from the query parameters

        const skip = (page - 1) * limit;

        const query = {};
        if (searchTerm) {
            // If search term is provided, add it to the query
            query.$or = [
                { title: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive username search
                { slug: { $regex: searchTerm, $options: 'i' } },    // Case-insensitive email search
            ];
        }

        const totalProduct = await productModel.countDocuments();

        const Product = await productModel
            .find(query)
            .sort({ _id: -1 }) // Sort by _id in descending order
            .skip(skip)
            .limit(limit)
            .lean();

        if (!Product) {
            return res.status(200).send
                ({
                    message: 'NO category found',
                    success: false,
                });
        }
        return res.status(200).send
            ({
                message: 'All category list ',
                ProductCount: Product.length,
                currentPage: page,
                totalPages: Math.ceil(totalProduct / limit),
                success: true,
                Product,
            });

    } catch (error) {
        return res.status(500).send
            ({
                message: `Error while getting category ${error}`,
                success: false,
                error
            })
    }
}

export const updateProductAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title, description, pImage, images, slug, metaDescription, metaTitle, regularPrice, salePrice, status, stock, variations, metaKeywords, Category, tag, sku, Barcode
        } = req.body;

        let updateFields = {
            title, description, pImage, images, slug, metaDescription, metaTitle, regularPrice, salePrice, Status: status, stock, variations, metaKeywords, Category, tag, sku, Barcode
        };


        const Product = await productModel.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        console.log('statusstatus', status)

        return res.status(200).json({
            message: 'product Updated!',
            success: true,
            Product,
        });
    } catch (error) {
        return res.status(400).json({
            message: `Error while updating product: ${error}`,
            success: false,
            error,
        });
    }
};

export const getProductIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const Product = await productModel.findById(id);
        if (!Product) {
            return res.status(200).send
                ({
                    message: 'product Not Found By Id',
                    success: false,
                });
        }
        return res.status(200).json({
            message: 'fetch Single product!',
            success: true,
            Product,
        });

    }
    catch (error) {
        return res.status(400).json({
            message: `Error while get product: ${error}`,
            success: false,
            error,
        });
    }
}

export const deleteProductAdmin = async (req, res) => {
    try {

        await productModel.findByIdAndDelete(req.params.id);


        return res.status(200).send({
            success: true,
            message: "Product Deleted!",
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr WHile Deleteing Product",
            error,
        });
    }
};


export const deleteAllProductAdmin = async (req, res) => {
    try {
        // Define the range for p_id
        const startId = 12;
        const endId = 53945;

        // Call the custom static method defined on the model
        await productModel.deleteProductsByRange(startId, endId);

        return res.status(200).send({
            success: true,
            message: "Products Deleted!",
        });
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Error while deleting products",
            error,
        });
    }
};


export const AddAdminAttributeController = async (req, res) => {
    try {
        const { name, image, type, color, value, status } = req.body;

        // Validation
        if (!name) {
            return res.status(400).send({
                success: false,
                message: "Please Provide name",
            });
        }

        // Create a new category with the specified parent
        const newAttribute = new attributeModel({ name, image, type, color, value, status });
        await newAttribute.save();

        return res.status(201).send({
            success: true,
            message: "Attribute Created!",
            newAttribute,
        });
    } catch (error) {
        console.error("Error while creating attribute:", error);
        return res.status(400).send({
            success: false,
            message: "Error while creating attribute",
            error,
        });
    }
};



export const getAllAttributeFillAdmin = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1; // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
        const searchTerm = req.query.search || ''; // Get search term from the query parameters

        const skip = (page - 1) * limit;

        const query = {};
        if (searchTerm) {
            // If search term is provided, add it to the query
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive username search
                { value: { $regex: searchTerm, $options: 'i' } },    // Case-insensitive email search
            ];
        }

        const totalattribute = await attributeModel.countDocuments();

        const Attribute = await attributeModel
            .find(query)
            .sort({ _id: -1 }) // Sort by _id in descending order
            .skip(skip)
            .limit(limit)
            .lean();

        if (!Attribute) {
            return res.status(200).send
                ({
                    message: 'NO attribute found',
                    success: false,
                });
        }
        return res.status(200).send
            ({
                message: 'All attribute list ',
                AttributeCount: Attribute.length,
                currentPage: page,
                totalPages: Math.ceil(totalattribute / limit),
                success: true,
                Attribute,
            });

    } catch (error) {
        return res.status(500).send
            ({
                message: `Error while getting category ${error}`,
                success: false,
                error
            })
    }
}

export const updateAttributeAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name, image, type, color, value, status
        } = req.body;

        let updateFields = {
            name, image, type, color, value, status
        };


        const Attribute = await attributeModel.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );



        return res.status(200).json({
            message: 'Attribute Updated!',
            success: true,
            Attribute,
        });
    } catch (error) {
        return res.status(400).json({
            message: `Error while updating attribute: ${error}`,
            success: false,
            error,
        });
    }
};

export const getAttributeIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const Attribute = await attributeModel.findById(id);
        if (!Attribute) {
            return res.status(200).send
                ({
                    message: 'product Not Found By Id',
                    success: false,
                });
        }
        return res.status(200).json({
            message: 'fetch Single product!',
            success: true,
            Attribute,
        });

    }
    catch (error) {
        return res.status(400).json({
            message: `Error while get product: ${error}`,
            success: false,
            error,
        });
    }
}

export const deleteAttributeAdmin = async (req, res) => {
    try {

        await attributeModel.findByIdAndDelete(req.params.id);


        return res.status(200).send({
            success: true,
            message: "Attribute Deleted!",
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr WHile Deleteing Attribute",
            error,
        });
    }
};


export const getAllAttribute = async (req, res) => {
    try {
        const Attribute = await attributeModel.find({}).lean()
        if (!Attribute) {
            return res.status(200).send
                ({
                    message: 'NO Attribute Find',
                    success: false,
                });
        }
        return res.status(200).send
            ({
                message: 'All Attribute List ',
                BlogCount: Attribute.length,
                success: true,
                Attribute,
            });

    } catch (error) {
        return res.status(500).send
            ({
                message: `error while getting Blogs ${error}`,
                success: false,
                error
            })
    }
}





export const AddAdminTagController = async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name) {
            return res.status(400).send({
                success: false,
                message: "Please Provide name",
            });
        }

        // Create a new category with the specified parent
        const newTag = new tagModel({ name });
        await newTag.save();

        return res.status(201).send({
            success: true,
            message: "Attribute Created!",
            newTag,
        });
    } catch (error) {
        console.error("Error while creating tag:", error);
        return res.status(400).send({
            success: false,
            message: "Error while creating tag",
            error,
        });
    }
};

export const getAllTagFillAdmin = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1; // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
        const searchTerm = req.query.search || ''; // Get search term from the query parameters

        const skip = (page - 1) * limit;

        const query = {};
        if (searchTerm) {
            // If search term is provided, add it to the query
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive username search
                // { value: { $regex: searchTerm, $options: 'i' } },    // Case-insensitive email search
            ];
        }

        const totalTag = await tagModel.countDocuments();

        const Tag = await tagModel
            .find(query)
            .sort({ _id: -1 }) // Sort by _id in descending order
            .skip(skip)
            .limit(limit)
            .lean();

        if (!Tag) {
            return res.status(200).send
                ({
                    message: 'NO tag found',
                    success: false,
                });
        }
        return res.status(200).send
            ({
                message: 'All tag list ',
                TagCount: Tag.length,
                currentPage: page,
                totalPages: Math.ceil(totalTag / limit),
                success: true,
                Tag,
            });

    } catch (error) {
        return res.status(500).send
            ({
                message: `Error while getting tag ${error}`,
                success: false,
                error
            })
    }
}

export const updateTagAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name
        } = req.body;

        let updateFields = {
            name
        };


        const Attribute = await tagModel.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );



        return res.status(200).json({
            message: 'Tag Updated!',
            success: true,
            Attribute,
        });
    } catch (error) {
        return res.status(400).json({
            message: `Error while updating tag: ${error}`,
            success: false,
            error,
        });
    }
};

export const getTagIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const Tag = await tagModel.findById(id);
        if (!Tag) {
            return res.status(200).send
                ({
                    message: 'Tag Not Found By Id',
                    success: false,
                });
        }
        return res.status(200).json({
            message: 'fetch Single Tag!',
            success: true,
            Tag,
        });

    }
    catch (error) {
        return res.status(400).json({
            message: `Error while get tag: ${error}`,
            success: false,
            error,
        });
    }
}

export const deleteTagAdmin = async (req, res) => {
    try {

        await tagModel.findByIdAndDelete(req.params.id);


        return res.status(200).send({
            success: true,
            message: "Tag Deleted!",
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr WHile Deleteing Tag",
            error,
        });
    }
};


export const getAllTag = async (req, res) => {
    try {
        const Tag = await tagModel.find({}).lean()
        if (!Tag) {
            return res.status(200).send
                ({
                    message: 'NO Tag Find',
                    success: false,
                });
        }
        return res.status(200).send
            ({
                message: 'All Tag List ',
                BlogCount: Tag.length,
                success: true,
                Tag,
            });

    } catch (error) {
        return res.status(500).send
            ({
                message: `error while getting Tag ${error}`,
                success: false,
                error
            })
    }
}



export const editHomeData = async (req, res) => {
    try {

        const {
            meta_title,
            meta_description,
            meta_head,
            meta_logo,
            meta_favicon,
            header,
            footer,
            footer_credit,
            phone,
            email,
            address,
            print, embroidery
        } = req.body;

        console.log(print, embroidery)
        let updateFields = {
            meta_title,
            meta_description,
            meta_head,
            meta_logo,
            meta_favicon,
            header,
            footer,
            footer_credit,
            phone,
            email,
            address,
            print, embroidery
        };

        const homeData = await homeModel.findOneAndUpdate({}, updateFields, {
            new: true,
        });

        if (homeData) {
            return res.status(200).json({
                message: "Home Settings Updated!",
                success: true,
                homeData,
            });
        } else {
            return res.status(404).json({
                message: "Home Settings not found.",
                success: false,
            });
        }

    } catch (error) {
        return res.status(400).json({
            message: `Error while Home Settings updating: ${error}`,
            success: false,
            error,
        });
    }
};


export const AddAdminPrivateStoreController = async (req, res) => {
    try {
        const { companyLogo, companyName, metaTitle, metaDescription, products,
            passwordStatus, password, status } = req.body;

        // Validation
        if (!companyName) {
            return res.status(400).send({
                success: false,
                message: "Please Provide Company Logo & Company Name",
            });
        }



        // Create a new category with the specified parent
        const Privatestore = new privatestoreModel({
            companyLogo, companyName, metaTitle, metaDescription, products,
            passwordStatus, password, status
        });

        await Privatestore.save();

        return res.status(201).send({
            success: true,
            message: "Private Store Created!",
            Privatestore,
        });
    } catch (error) {
        console.error("Error while creating Private Store:", error);
        return res.status(400).send({
            success: false,
            message: "Error while creating Private Store",
            error,
        });
    }
};

export const getAllPrivateStoreFillAdmin = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1; // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
        const searchTerm = req.query.search || ''; // Get search term from the query parameters

        const skip = (page - 1) * limit;

        const query = {};
        if (searchTerm) {
            // If search term is provided, add it to the query
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive username search
                // { value: { $regex: searchTerm, $options: 'i' } },    // Case-insensitive email search
            ];
        }

        const totalprivatestore = await privatestoreModel.countDocuments();

        const Privatestore = await privatestoreModel
            .find(query)
            .sort({ _id: -1 }) // Sort by _id in descending order
            .skip(skip)
            .limit(limit)
            .lean();

        if (!Privatestore) {
            return res.status(200).send
                ({
                    message: 'NO tag found',
                    success: false,
                });
        }
        return res.status(200).send
            ({
                message: 'All Private Store list ',
                totalCount: Privatestore.length,
                currentPage: page,
                totalPages: Math.ceil(totalprivatestore / limit),
                success: true,
                Privatestore,
            });

    } catch (error) {
        return res.status(500).send
            ({
                message: `Error while getting tag ${error}`,
                success: false,
                error
            })
    }
}

export const updatePrivateStoreAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            companyLogo, companyName, metaTitle, metaDescription, products,
            passwordStatus, password, status
        } = req.body;

        let updateFields = {
            companyLogo, companyName, metaTitle, metaDescription, products,
            passwordStatus, password, status
        };

        const privatestore = await privatestoreModel.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        return res.status(200).json({
            message: 'Private store Updated!',
            success: true,
            privatestore,
        });
    } catch (error) {
        return res.status(400).json({
            message: `Error while updating Private store: ${error}`,
            success: false,
            error,
        });
    }
};

export const getPrivateStoreIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const Privatestore = await privatestoreModel.findById(id);
        if (!Privatestore) {
            return res.status(200).send
                ({
                    message: 'Private store Not Found By Id',
                    success: false,
                });
        }
        return res.status(200).json({
            message: 'Fetch private store!',
            success: true,
            Privatestore,
        });

    }
    catch (error) {
        return res.status(400).json({
            message: `Error while get tag: ${error}`,
            success: false,
            error,
        });
    }
}

export const deletePrivateStoreAdmin = async (req, res) => {
    try {

        await privatestoreModel.findByIdAndDelete(req.params.id);


        return res.status(200).send({
            success: true,
            message: "Private Store Deleted!",
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr WHile Deleteing Private Store",
            error,
        });
    }
};


// for private product 




// for pages 


export const AddAdminPageController = async (req, res) => {
    try {
        const { title, description, metaTitle, metaDescription, metaKeywords } = req.body;

        // Validation
        if (!title || !description) {
            return res.status(400).send({
                success: false,
                message: "Please Provide All Field",
            });
        }

        // Create a new category with the specified parent
        const newPage = new pageModel({
            title, description, metaTitle, metaDescription, metaKeywords
        });
        await newPage.save();

        return res.status(201).send({
            success: true,
            message: "Page created!",
            newPage,
        });
    } catch (error) {
        console.error("Error while creating Page:", error);
        return res.status(400).send({
            success: false,
            message: "Error while creating Promo code",
            error,
        });
    }
};


export const getAllPageAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
        const searchTerm = req.query.search || ""; // Get search term from the query parameters

        const skip = (page - 1) * limit;

        const query = {};
        if (searchTerm) {
            const regex = new RegExp(searchTerm, "i"); // Case-insensitive regex pattern for the search term

            // Add regex pattern to search both username and email fields for the full name
            query.$or = [
                { title: regex },
                // { description: regex },
            ];
        }

        const totalUser = await pageModel.countDocuments(query); // Count total documents matching the query

        const Mpage = await pageModel
            .find(query)
            .sort({ _id: -1 }) // Sort by _id in descending order
            .skip(skip)
            .limit(limit)
            .lean(); // Convert documents to plain JavaScript objects

        if (!Mpage || Mpage.length === 0) { // Check if no users found
            return res.status(404).send({ // Send 404 Not Found response
                message: "No Page found",
                success: false,
            });
        }

        return res.status(200).send({ // Send successful response
            message: "All Page list",
            Count: Mpage.length,
            currentPage: page,
            totalPages: Math.ceil(totalUser / limit),
            success: true,
            Mpage, // Return users array
        });
    } catch (error) {
        return res.status(500).send({ // Send 500 Internal Server Error response
            message: `Error while Page: ${error.message}`,
            success: false,
            error,
        });
    }
};

export const updatePageAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const { title, description, metaTitle, metaDescription, metaKeywords
        } = req.body;

        let updateFields = {
            title, description, metaTitle, metaDescription, metaKeywords
        };

        const MPage = await pageModel.findByIdAndUpdate(id, updateFields, {
            new: true,
        });

        return res.status(200).json({
            message: "Page Updated!",
            success: true,
            MPage,
        });
    } catch (error) {
        return res.status(400).json({
            message: `Error while updating Page: ${error}`,
            success: false,
            error,
        });
    }
};

export const getPageIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const Mpage = await pageModel.findById(id);
        if (!Mpage) {
            return res.status(200).send({
                message: "Page not found",
                success: false,
            });
        }
        return res.status(200).json({
            message: "fetch Single Page!",
            success: true,
            Mpage,
        });
    } catch (error) {
        return res.status(400).json({
            message: `Error while get Page: ${error}`,
            success: false,
            error,
        });
    }
};

export const deletePageAdmin = async (req, res) => {
    try {
        await pageModel.findByIdAndDelete(req.params.id);

        return res.status(200).send({
            success: true,
            message: "Page Deleted!",
        });
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr While Deleteing Page",
            error,
        });
    }
};




export const editOrderAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await orderModel.findById(id).populate('userId'); // Fetch order details including user

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                success: false,
            });
        }

        const user = order.userId[0]; // Assuming there's only one user associated with the order

        const { email, username, _id } = user; // Extract user email

        let updateFields = {
            status,
        };

        const updatedOrder = await orderModel.findByIdAndUpdate(id, updateFields, {
            new: true,
        });

        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            // SMTP configuration
            host: process.env.MAIL_HOST, // Update with your SMTP host
            port: process.env.MAIL_PORT, // Update with your SMTP port
            secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
            auth: {
                user: process.env.MAIL_USERNAME, // Update with your email address
                pass: process.env.MAIL_PASSWORD, // Update with your email password
            }
        });

        // Email message
        const mailOptions = {
            from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
            to: email, // Use the extracted email here
            subject: `brandmenow.co.uk Order ${status === '0' ? 'cancel' :
                status === '1' ? 'Placed' :
                    status === '2' ? 'Accepted' :
                        status === '3' ? 'Packed' :
                            status === '4' ? 'Shipped' :
                                status === '5' ? 'Delivered' :
                                    'Unknown'
                }`,
            html: `
            <div class="bg-light w-100 h-100" style="background-color:#f8f9fa!important;width: 90%;font-family:sans-serif;padding:20px;border-radius:10px;padding: 100px 0px;margin: auto;">
       <div class="modal d-block" style="
          width: 500px;
          background: white;
          padding: 20px;
          margin: auto;
          border: 2px solid #8080802e;
          border-radius: 10px;
      ">
        <div class="modal-dialog">
          <div class="modal-content" style="
          text-align: center;
      ">
            <div class="modal-header">
      <h1 style="color:black;"> Brand Me Now <h1>
            </div>
            <div class="modal-body text-center">
              <h5 style="
          margin: 0px;
          margin-top: 14px;
          font-size: 20px;color:black;
      "> Order Id : #${order._id} </h5>
             <p style="color:black;" >Hey ${username},</p>
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#47ca00" stroke-width="2" stroke-linecap="square" stroke-linejoin="arcs"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
             <h2 style="color:black;"> Your Order Is ${status === '1' ? 'Placed' :
                    status === '2' ? 'Accepted' :
                        status === '3' ? 'Packed' :
                            status === '4' ? 'Shipped' :
                                status === '5' ? 'Delivered' :
                                    'Unknown'
                }! </h2>
           
             <p style="color:black;" > We'll send you a shipping confirmation email
      as soon as your order ${status === '1' ? 'Placed' :
                    status === '2' ? 'Accepted' :
                        status === '3' ? 'Packed' :
                            status === '4' ? 'Shipped' :
                                status === '5' ? 'Delivered' :
                                    'Unknown'
                }. </p>
            </div>
            <div class="modal-footer">
        
              <a href="/order/${_id}/${updatedOrder._id}" style="
          background: green;
          color: white;
          padding: 10px;
          display: block;
          margin: auto;
          border-radius: 6px;
          text-decoration: none;
      "> Track Order</a>
            </div>
          </div>
        </div>
      </div> </div>
            `
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
                res.status(500).send('Failed to send email');
            } else {
                return res.status(200).json({
                    message: "Order Updated!",
                    success: true,
                });
            }
        });

    } catch (error) {
        return res.status(400).json({
            message: `Error while updating Rating: ${error}`,
            success: false,
            error,
        });
    }
};


export const editDetailOrderAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, phone, address, pincode, username } = req.body;

        // Check if ID is provided
        if (!id) {
            return res.status(400).json({
                message: "Order ID is required",
                success: false,
            });
        }

        // Update the order
        const result = await orderModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    "details.0.phone": phone,
                    "details.0.address": address,
                    "details.0.username": username,
                    "details.0.email": email,
                    "details.0.pincode": pincode
                }
            },
            { new: true } // Return the updated document
        );

        // Check if the result is null
        if (!result) {
            return res.status(404).json({
                message: "Order not found",
                success: false,
            });
        }

        // Respond with success
        return res.status(200).json({
            message: "Order Updated!",
            success: true,
            data: result
        });

    } catch (error) {
        return res.status(400).json({
            message: `Error while updating order: ${error.message}`,
            success: false,
            error: error.message,
        });
    }
};




export const AddAdminPrivateProductController = async (req, res) => {
    try {
        const { title, description, pImage, images, slug,
            metaDescription, metaTitle, metaKeywords, salePrice, regularPrice, Status, variations
        } = req.body;

        // Validation
        if (!title || !description || !regularPrice || !salePrice) {
            return res.status(400).send({
                success: false,
                message: "Please Provide Product details!",
            });
        }

        // Create a new category with the specified parent
        const privateProduct = new privateProductModel({
            title, description, pImage, images, slug,
            metaDescription, metaTitle, metaKeywords, salePrice, regularPrice, Status, variations
        });

        await privateProduct.save();

        return res.status(201).send({
            success: true,
            message: "Private Product Created!",
            privateProduct,
        });
    } catch (error) {
        console.error("Error while creating Private Product:", error);
        return res.status(400).send({
            success: false,
            message: "Error while creating Private Store",
            error,
        });
    }
};


export const getAllPrivateProductFillAdmin = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1; // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
        const searchTerm = req.query.search || ''; // Get search term from the query parameters

        const skip = (page - 1) * limit;

        const query = {};
        if (searchTerm) {
            // If search term is provided, add it to the query
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive username search
                // { value: { $regex: searchTerm, $options: 'i' } },    // Case-insensitive email search
            ];
        }

        const totalcount = await privateProductModel.countDocuments();

        const PrivateProduct = await privateProductModel
            .find(query)
            .sort({ _id: -1 }) // Sort by _id in descending order
            .skip(skip)
            .limit(limit)
            .lean();

        if (!PrivateProduct) {
            return res.status(200).send
                ({
                    message: 'NO Private Product found',
                    success: false,
                });
        }
        return res.status(200).send
            ({
                message: 'All Private Product list ',
                totalCount: PrivateProduct.length,
                currentPage: page,
                totalPages: Math.ceil(totalcount / limit),
                success: true,
                PrivateProduct,
            });

    } catch (error) {
        return res.status(500).send
            ({
                message: `Error while Getting Private Product ${error}`,
                success: false,
                error
            })
    }
}

export const updatePrivateProductAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title, description, pImage, images, slug,
            metaDescription, metaTitle, metaKeywords, salePrice, regularPrice, Status, variations
        } = req.body;

        let updateFields = {
            title, description, pImage, images, slug,
            metaDescription, metaTitle, metaKeywords, salePrice, regularPrice, Status, variations
        };

        const privatestore = await privateProductModel.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        return res.status(200).json({
            message: 'Private Product Updated!',
            success: true,
            privatestore,
        });
    } catch (error) {
        return res.status(400).json({
            message: `Error while updating Private Product: ${error}`,
            success: false,
            error,
        });
    }
};

export const getPrivateProductIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const Privatestore = await privateProductModel.findById(id);
        if (!Privatestore) {
            return res.status(200).send
                ({
                    message: 'Private Product Not Found By Id',
                    success: false,
                });
        }
        return res.status(200).json({
            message: 'Fetch private Product!',
            success: true,
            Privatestore,
        });

    }
    catch (error) {
        return res.status(400).json({
            message: `Error while get tag: ${error}`,
            success: false,
            error,
        });
    }
}

export const deletePrivateProductAdmin = async (req, res) => {
    try {

        await privateProductModel.findByIdAndDelete(req.params.id);


        return res.status(200).send({
            success: true,
            message: "Private Product Deleted!",
        });

    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success: false,
            message: "Erorr WHile Deleteing Private Store",
            error,
        });
    }
};




export const getAllOrderAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
        const searchTerm = req.query.search || ""; // Get search term from the query parameters

        const skip = (page - 1) * limit;

        const query = {};
        if (searchTerm) {
            // If search term is provided, add it to the query
            query.$or = [
                { userId: { $regex: searchTerm, $options: "i" } }, // Case-insensitive username search
                { _id: { $regex: searchTerm, $options: "i" } }, // Case-insensitive email search
            ];
        }

        const totalOrder = await orderModel.countDocuments(query); // Count documents matching the query

        const Order = await orderModel
            .find(query)
            .sort({ _id: -1 }) // Sort by _id in descending order
            .skip(skip)
            .limit(limit)
            .populate({
                path: "userId",
                model: userModel,
                select: "username",
            }).lean();

        if (!Order || Order.length === 0) {
            return res.status(200).send({
                message: "No Order found",
                success: false,
            });
        }
        return res.status(200).send({
            message: "All Order list",
            OrderCount: Order.length,
            currentPage: page,
            totalPages: Math.ceil(totalOrder / limit),
            success: true,
            Order,
        });
    } catch (error) {
        return res.status(500).send({
            message: `Error while getting Orders: ${error}`,
            success: false,
            error,
        });
    }
};



export const getAllUserAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page, default is 1
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page, default is 10
        const searchTerm = req.query.search || ""; // Get search term from the query parameters

        const skip = (page - 1) * limit;

        const query = {};
        if (searchTerm) {
            const regex = new RegExp(searchTerm, "i"); // Case-insensitive regex pattern for the search term

            // Add regex pattern to search both username and email fields for the full name
            query.$or = [
                { username: regex },
                { email: regex },
                { phone: regex } // Add phone number search if needed
            ];
        }

        const totalUser = await userModel.countDocuments(query); // Count total documents matching the query

        const users = await userModel
            .find(query)
            .sort({ _id: -1 }) // Sort by _id in descending order
            .skip(skip)
            .limit(limit)
            .lean(); // Convert documents to plain JavaScript objects

        if (!users || users.length === 0) { // Check if no users found
            return res.status(404).send({ // Send 404 Not Found response
                message: "No users found",
                success: false,
            });
        }

        return res.status(200).send({ // Send successful response
            message: "All user list",
            userCount: users.length,
            currentPage: page,
            totalPages: Math.ceil(totalUser / limit),
            success: true,
            users, // Return users array
        });
    } catch (error) {
        return res.status(500).send({ // Send 500 Internal Server Error response
            message: `Error while getting users: ${error.message}`,
            success: false,
            error,
        });
    }
};

export const editUserAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const { status } = req.body;

        let updateFields = {
            status,
        };

        const user = await userModel.findByIdAndUpdate(id, updateFields, {
            new: true,
        });
        if (!user) {
            return res.status(200).send({
                message: "NO User found",
                success: false,
            });
        }

        return res.status(200).json({
            message: "User Updated!",
            success: true,
            user,
        });
    } catch (error) {
        return res.status(400).json({
            message: `Error while updating User: ${error}`,
            success: false,
            error,
        });
    }
};

export const getUserIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const User = await userModel.findById(id);
        if (!User) {
            return res.status(200).send({
                message: "User Not Found By Id",
                success: false,
            });
        }
        return res.status(200).json({
            message: "fetch Single User!",
            success: true,
            User,
        });
    } catch (error) {
        return res.status(400).json({
            message: `Error while get User : ${error}`,
            success: false,
            error,
        });
    }
};





export const exportAllProAdmin = async (req, res) => {

    try {
        // Fetch data from the database (assuming using Mongoose)
        //   const products = await productModel.find({}, 'title description pImage images slug regularPrice salePrice status stock Category weight tag').lean();
        const products = await productModel.find({}, 'p_id title description Category pImage  images slug regularPrice salePrice status stock weight gst hsn sku variations specifications metaTitle metaDescription metaKeywords ').lean();

        const filename = 'all_products.csv';

        // Stringify the product data
        stringify(products, { header: true }, (err, csvString) => {
            if (err) {
                console.error('Error generating CSV:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            // Set response headers
            res.header('Content-Type', 'text/csv');
            res.attachment(filename);

            // Send CSV data
            res.send(csvString);

        });
    } catch (error) {
        console.error('Error exporting products:', error);
        res.status(500).send('Internal Server Error');
    }

};



export const importAllProAdmin = async (req, res) => {
    try {
        const jsonData = req.body;

        if (!jsonData || !Array.isArray(jsonData)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON data provided'
            });
        }

        try {
            // Process the parsed JSON data
            for (const productData of jsonData) {

                if (productData.p_id !== undefined) {

                    if (!isNaN(productData.p_id)) {
                        productData.p_id = parseFloat(productData.p_id);
                    }
                    if (productData.p_id !== 'new') {
                        try {
                            // Check if the product already exists
                            const existingProduct = await productModel.findOne({ p_id: productData.p_id }).lean();
                            if (existingProduct) {

                                if (typeof productData.regularPrice === 'string') {
                                    productData.regularPrice = parseFloat(productData.regularPrice);
                                }
                                if (typeof productData.salePrice === 'string') {
                                    productData.salePrice = parseFloat(productData.salePrice);
                                }
                                if (typeof productData.status === 'string') {
                                    productData.status = productData.status.toLowerCase();
                                }
                                await productModel.findOneAndUpdate({ p_id: productData.p_id }, productData);

                            }

                        } catch (error) {
                            console.error('Error importing product:', error);
                        }
                    } else { }

                    if (productData.p_id === 'new') {

                        const lastProduct = await productModel.findOne().sort({ _id: -1 }).limit(1);
                        if (typeof lastProduct.p_id === 'string') {
                            lastProduct.p_id = parseFloat(lastProduct.p_id);
                        }

                        const lastProductId = lastProduct ? lastProduct.p_id : 0;

                        // Calculate the auto-increment ID
                        const pro_id = lastProductId + 1;


                        try {

                            if (typeof productData.regularPrice === 'string') {
                                productData.regularPrice = parseFloat(productData.regularPrice);
                            }
                            if (typeof productData.salePrice === 'string') {
                                productData.salePrice = parseFloat(productData.salePrice);
                            }
                            if (typeof productData.status === 'string') {
                                productData.status = productData.status.toLowerCase();
                            }


                            const {
                                title,
                                description,
                                pImage,
                                images,
                                slug,
                                regularPrice,
                                salePrice,
                                status,
                                stock,
                                Category,
                                variations,
                                metaTitle,
                                metaDescription,
                                metaKeywords
                            } = productData;

                            const newProduct = new productModel({
                                p_id: pro_id,
                                title,
                                description,
                                pImage,
                                images,
                                slug,
                                regularPrice,
                                salePrice,
                                status,
                                stock,
                                Category,
                                variations,
                                metaTitle,
                                metaDescription,
                                metaKeywords
                            });


                            // Save the product to the database
                            await newProduct.save();

                        } catch (error) {
                            console.error('Error importing product:', error);
                        }

                    }


                    console.log(productData.p_id)

                }

            }

            console.log('Products imported successfully');
            return res.status(200).json({
                success: true,
                message: 'Products imported successfully'
            });

        } catch (error) {
            console.error('Error importing products:', error);
            return res.status(500).json({
                success: false,
                message: 'Error while importing products',
                error: error.message
            });
        }

    } catch (error) {
        console.error('Error importing products:', error);
        return res.status(500).json({
            success: false,
            message: 'Error while importing products',
            error: error.message
        });
    }
};


export const exportAllUserAdmin = async (req, res) => {

    try {
        // Fetch data from the database (assuming using Mongoose)
        //   const products = await productModel.find({}, 'title description pImage images slug regularPrice salePrice status stock Category weight tag').lean();
        const products = await userModel.find({}, 'u_id username email phone  address').lean();

        const filename = 'all_users.csv';

        // Stringify the product data
        stringify(products, { header: true }, (err, csvString) => {
            if (err) {
                console.error('Error generating CSV:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            // Set response headers
            res.header('Content-Type', 'text/csv');
            res.attachment(filename);

            // Send CSV data
            res.send(csvString);

        });
    } catch (error) {
        console.error('Error exporting users:', error);
        res.status(500).send('Internal Server Error');
    }

};


export const importAllUserAdmin = async (req, res) => {

    try {
        const jsonData = req.body;

        if (!jsonData || !Array.isArray(jsonData)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON data provided'
            });
        }

        try {
            // Process the parsed JSON data
            for (const userData of jsonData) {

                if (userData.u_id !== undefined) {

                    if (!isNaN(userData.u_id)) {
                        userData.u_id = parseFloat(userData.u_id);
                    }
                    if (userData.u_id !== 'new') {
                        try {
                            // Check if the product already exists
                            const existingUser = await userModel.findOne({ u_id: userData.u_id }).lean();
                            if (existingUser) {


                                if (typeof userData.phone === 'string') {
                                    userData.phone = parseFloat(userData.phone);
                                }

                                await userModel.findOneAndUpdate({ u_id: userData.u_id }, userData);

                            }

                        } catch (error) {
                            console.error('Error importing user:', error);
                        }
                    } else { }

                    if (userData.u_id === 'new') {

                        const lastUser = await userModel.findOne().sort({ _id: -1 }).limit(1);
                        if (typeof lastUser.u_id === 'string') {
                            lastUser.u_id = parseFloat(lastUser.u_id);
                        }

                        const lastUserId = lastUser ? lastUser.u_id : 0;

                        // Calculate the auto-increment ID
                        const user_id = lastUserId + 1;


                        try {

                            if (typeof userData.phone === 'string') {
                                userData.phone = parseFloat(userData.phone);
                            }


                            const {
                                username,
                                email,
                                phone,
                                address,

                            } = userData;

                            const newUser = new userModel({
                                u_id: user_id,
                                username,
                                email,
                                phone,
                                address,
                            });


                            // Save the product to the database
                            await newUser.save();

                        } catch (error) {
                            console.error('Error importing user:', error);
                        }

                    }


                    console.log(userData.p_id)

                }

            }

            console.log('User imported successfully');
            return res.status(200).json({
                success: true,
                message: 'User imported successfully'
            });

        } catch (error) {
            console.error('Error importing User:', error);
            return res.status(500).json({
                success: false,
                message: 'Error while importing products',
                error: error.message
            });
        }

    } catch (error) {
        console.error('Error importing User:', error);
        return res.status(500).json({
            success: false,
            message: 'Error while importing User',
            error: error.message
        });
    }


};


export const editHomeLayoutData = async (req, res) => {
    try {

        const {
            home_slider,
            trending_product,
            trending_product_banner,
            trending_product_carousal,
            best_selling_laptop,
            collection_heading,
            collection_paragraph,
            collection_url,
            collection_img,
            latest_product,
            latest_product_banner,
            latest_product_carousal,
            best_selling_smartphone,
            recommended_products
        } = req.body;

        let updateFields = {
            home_slider,
            trending_product,
            trending_product_banner,
            trending_product_carousal,
            best_selling_laptop,
            collection_heading,
            collection_paragraph,
            collection_url,
            collection_img,
            latest_product,
            latest_product_banner,
            latest_product_carousal,
            best_selling_smartphone,
            recommended_products
        };

        const homeLayoutData = await homeLayoutModel.findOneAndUpdate({}, updateFields, {
            new: true,
        });

        if (homeLayoutData) {
            return res.status(200).json({
                message: "Home Layout Updated!",
                success: true,
                homeLayoutData,
            });
        } else {
            return res.status(404).json({
                message: "Home Layout not found.",
                success: false,
            });
        }

    } catch (error) {
        return res.status(400).json({
            message: `Error while Home Layout updating: ${error}`,
            success: false,
            error,
        });
    }
};






