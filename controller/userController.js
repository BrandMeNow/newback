import mongoose from "mongoose";
import blogModel from "../models/blogModel.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
import categoryModel from "../models/categoryModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import attributeModel from "../models/attributeModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import cartModel from "../models/cartModel.js";
import homeModel from "../models/homeModel.js";
import homeLayoutModel from "../models/homeLayoutModel.js";
import privateProductModel from "../models/privateProductModel.js";
import stripe from 'stripe';
import nodemailer from 'nodemailer';


const stripeInstance = stripe('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');
// const stripeInstance = stripe(STRIPE_SECRET_KEY);

// Your controller function goes here


dotenv.config();
const secretKey = process.env.SECRET_KEY;

export const SignupUser_old = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all fields',
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: 'User Already Exists',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new userModel({ username, email, password: hashedPassword });
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
    user.token = token; // Update the user's token field with the generated token
    await user.save();

    // Generate JWT token

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Error on signup:', error);
    res.status(500).json({
      success: false,
      message: 'Error on signup',
      error: error.message,
    });
  }
}


export const SignupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all fields',
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: 'User Already Exists',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new cartModel for the user
    const cart = new cartModel();
    await cart.save();

    // Create a new user and set cartId
    const user = new userModel({ username, email, password: hashedPassword, cartId: cart._id });
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
    user.token = token;

    // Save the user to the database
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
      token,
    });
  } catch (error) {
    console.error('Error on signup:', error);
    res.status(500).json({
      success: false,
      message: 'Error on signup',
      error: error.message,
    });
  }
};


// get home data 

export const getHomeData = async (req, res) => {
  try {
    const homeData = await homeModel.findOne();

    if (!homeData) {
      return res.status(200).send({
        message: "Home Settings Not Found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Found home settings!",
      success: true,
      homeData,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while getting home settings: ${error}`,
      success: false,
      error,
    });
  }
};



export const UsergetAllHomeProducts = async (req, res) => {

  try {
    const products = await productModel.find({}, '_id title pImage regularPrice salePrice stock');

    if (!products) {
      return res.status(200).send
        ({
          message: 'NO products Find',
          success: false,
        });
    }
    return res.status(200).send
      ({
        message: 'All products List ',
        proCount: products.length,
        success: true,
        products,
      });

  } catch (error) {
    return res.status(500).send
      ({
        message: `error while All products ${error}`,
        success: false,
        error
      })
  }


}

export const GetAllCategoriesByParentIdController = async (req, res) => {
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
      .select("title metaTitle metaDescription metaKeywords")
      .lean();

    const filters = { Category: parentId }; // Initialize filters with parent category filter

    if (filter) {
      // Parse the filter parameter
      const filterParams = JSON.parse(filter);

      // Iterate through each parameter in the filter
      Object.keys(filterParams).forEach((param) => {
        // Split parameter values by comma if present
        const paramValues = filterParams[param].split(",");
        const variationsKey = `variations.${param}.${param}`;

        // Handle multiple values for the parameter
        filters[variationsKey] = { $in: paramValues };
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
    const productsFilter = await productModel.find(Procat).select("_id regularPrice salePrice variations").lean();

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




// get home layout data 


export const getHomeLayoutData = async (req, res) => {
  try {
    const homeLayout = await homeLayoutModel.findOne();

    if (!homeLayout) {
      return res.status(200).send({
        message: "Home Layout Not Found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Found home Layout Data!",
      success: true,
      homeLayout,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while getting home Layout: ${error}`,
      success: false,
      error,
    });
  }
};


export const Userlogin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: 'please fill all fields'
      })
    }
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.status(200).send({
        success: false,
        message: 'email is not registerd',
        user,
      });
    }
    // password check

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: 'password is not incorrect',
        user
        ,
      });
    }

    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

    return res.status(200).send({
      success: true,
      message: 'login sucesssfully',
      user,
    })

  } catch (error) {
    return res.status(500).send
      ({
        message: `error on login ${error}`,
        sucesss: false,
        error
      })
  }
}




export const updateUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, pincode, country, address, token } = req.body;
    console.log(phone, pincode, country, address, token)
    const user = await userModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true })
    return res.status(200).json({
      message: 'user Updated!',
      success: true,
      user,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating user: ${error}`,
      success: false,
      error,
    });
  }
}


export const getAllBlogsController = async (req, res) => {
  try {
    const blogs = await blogModel.find({}).lean()
    if (!blogs) {
      return res.status(200).send
        ({
          message: 'NO Blogs Find',
          success: false,
        });
    }
    return res.status(200).send
      ({
        message: 'All Blogs List ',
        BlogCount: blogs.length,
        success: true,
        blogs,
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

export const createBlogController = async (req, res) => {
  try {
    const { title, description, image, user } = req.body;
    //validation
    if (!title || !description || !image || !user) {
      return res.status(400).send({
        success: false,
        message: "Please Provide ALl Fields",
      });
    }
    const exisitingUser = await userModel.findById(user);
    //validaton
    if (!exisitingUser) {
      return res.status(404).send({
        success: false,
        message: "unable to find user",
      });
    }

    const newBlog = new blogModel({ title, description, image, user });
    const session = await mongoose.startSession();
    session.startTransaction();
    await newBlog.save({ session });
    exisitingUser.blogs.push(newBlog);
    await exisitingUser.save({ session });
    await session.commitTransaction();
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



export const updateBlogController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image } = req.body;
    const blog = await blogModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true })
    return res.status(200).json({
      message: 'Blog Updated!',
      success: true,
      blog,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Blog: ${error}`,
      success: false,
      error,
    });
  }
}

export const getBlogIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await blogModel.findById(id);
    if (!blog) {
      return res.status(200).send
        ({
          message: 'Blog Not Found By Id',
          success: false,
        });
    }
    return res.status(200).json({
      message: 'fetch Single Blog!',
      success: true,
      blog,
    });

  }
  catch (error) {
    return res.status(400).json({
      message: `Error while get Blog: ${error}`,
      success: false,
      error,
    });
  }
}

export const deleteBlogController = async (req, res) => {
  try {
    const blog = await blogModel
      // .findOneAndDelete(req.params.id)
      .findByIdAndDelete(req.params.id)
      .populate("user");
    await blog.user.blogs.pull(blog);
    await blog.user.save();
    return res.status(200).send({
      success: true,
      message: "Blog Deleted!",
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
export const userBlogsController = async (req, res) => {
  try {
    const userBlog = await userModel.findById(req.params.id).populate('blogs')
    if (!userBlog) {
      return res.status(200).send
        ({
          message: 'Blog Not Found By user',
          success: false,
        });
    }
    return res.status(200).json({
      message: ' user Blog!',
      success: true,
      userBlog,
    });

  }
  catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Erorr WHile Deleteing BLog",
      error,
    });
  }

}

export const userTokenController = async (req, res) => {
  try {

    const { id } = req.params;
    const user = await userModel.findOne({ token: id })

    if (!user) {
      return res.status(200).send
        ({
          message: 'Token expire',
          success: false,
        });
    }
    return res.status(200).send
      ({
        message: 'token Found',
        success: true,
        user,
      });
  }
  catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Token Not Authorise",
      error,
    });
  }
}


export const CreateChatController = async (req, res) => {
  const { firstId, secondId } = req.body;
  try {
    const chat = await chatModel.findOne({
      members: { $all: [firstId, secondId] }
    })
    if (chat) return res.status(200).json(chat);
    const newChat = new chatModel({
      members: [firstId, secondId]
    })
    const response = await newChat.save()
    res.status(200).send
      ({
        message: 'Chat Added',
        success: true,
        response,
      });

  }
  catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Chat Not Upload",
      error,
    });
  }
}


export const findUserschatController = async (req, res) => {
  const userId = req.params.id;

  try {
    const chats = await chatModel.find({
      members: { $in: [userId] }
    })
    return res.status(200).send
      ({
        message: 'Chat Added',
        success: true,
        chats,
      });

  }
  catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "User chat Not Found",
      error,
    });
  }
}



export const findchatController = async (req, res) => {
  const { firstId, secondId } = req.params;

  try {
    const chats = await chatModel.find({
      members: { $all: [firstId, secondId] }
    })
    res.status(200).send
      ({
        message: 'Chat Added',
        success: true,
        chats,
      });
  }
  catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "User chat Not Found",
      error,
    });
  }
}





export const UsergetAllCategories = async (req, res) => {

  try {
    const categories = await categoryModel.find({ parent: { $exists: false } });

    if (!categories) {
      return res.status(200).send
        ({
          message: 'NO Blogs Find',
          success: false,
        });
    }
    return res.status(200).send
      ({
        message: 'All Catgeory List ',
        catCount: categories.length,
        success: true,
        categories,
      });

  } catch (error) {
    return res.status(500).send
      ({
        message: `error while All Categories ${error}`,
        success: false,
        error
      })
  }


}

export const UsergetAllProducts = async (req, res) => {

  try {
    const products = await productModel.find({});

    if (!products) {
      return res.status(200).send
        ({
          message: 'NO Products Find',
          success: false,
        });
    }
    return res.status(200).send
      ({
        message: 'All Products List ',
        catCount: products.length,
        success: true,
        products,
      });

  } catch (error) {
    return res.status(500).send
      ({
        message: `error while All Products ${error}`,
        success: false,
        error
      })
  }


}


export const UsergetAllPrivateProducts = async (req, res) => {

  try {
    const products = await privateProductModel.find({});

    if (!products) {
      return res.status(200).send
        ({
          message: 'NO Products Find',
          success: false,
        });
    }
    return res.status(200).send
      ({
        message: 'All Products List ',
        catCount: products.length,
        success: true,
        products,
      });

  } catch (error) {
    return res.status(500).send
      ({
        message: `error while All Products ${error}`,
        success: false,
        error
      })
  }


}



export const UserGetAllProducts = async (req, res) => {

  try {
    const products = await productModel.find({});

    if (!products) {
      return res.status(200).send
        ({
          message: 'NO Products Find',
          success: false,
        });
    }
    return res.status(200).send
      ({
        message: 'All Products List ',
        catCount: products.length,
        success: true,
        products,
      });

  } catch (error) {
    return res.status(500).send
      ({
        message: `error while All Products ${error}`,
        success: false,
        error
      })
  }


}

export const getAllAttributeUser = async (req, res) => {
  try {
    const Attribute = await attributeModel.find({})
    if (!Attribute) {
      return res.status(200).send
        ({
          message: 'NO Attribute Found',
          success: false,
        });
    }
    return res.status(200).send
      ({
        message: 'All Attribute List ',
        AttributeCount: Attribute.length,
        success: true,
        Attribute,
      });

  } catch (error) {
    return res.status(500).send
      ({
        message: `error while getting attribute ${error}`,
        success: false,
        error
      })
  }
}




export const getProductIdUser = async (req, res) => {
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

export const userOrdersViewController = async (req, res) => {
  try {
    const { userId, orderId } = req.params;


    // Find the user by ID and populate their orders
    const userOrder = await userModel.findById(userId)
      .populate({
        path: 'orders',
        match: { _id: orderId } // Match the order ID
      });

    // If user or order not found, return appropriate response
    if (!userOrder || !userOrder.orders.length) {
      return res.status(404).json({
        message: 'Order Not Found By user or Order ID',
        success: false,
      });
    }

    // If user order found, return success response with the single order
    return res.status(200).json({
      message: 'Single Order Found By user ID and Order ID',
      success: true,
      userOrder: userOrder.orders[0], // Assuming there's only one order per user
    });
  } catch (error) {
    // If any error occurs during the process, log it and return error response
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Error while getting order",
      error,
    });
  }
}



export const getPrivateProductIdUser = async (req, res) => {
  try {
    const { id } = req.params;
    const Product = await privateProductModel.findById(id);
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


export const getCollectionProductIdUser = async (req, res) => {
  try {
    const { storeid, id } = req.params;

    // Check if the product with the specified ID exists
    const Product = await privateProductModel.findById(id);
    if (!Product) {
      return res.status(404).json({
        message: 'Product not found by ID',
        success: false,
      });
    }

    return res.status(200).json({
      message: 'Fetched single product',
      success: true,
      Product,
    });

  } catch (error) {
    return res.status(400).json({
      message: `Error while getting product: ${error.message}`,
      success: false,
      error,
    });
  }
};



async function sendOrderConfirmationEmail(email, username, userId, newOrder) {
  try {
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
      to: email, // Update with your email address
      cc: process.env.MAIL_FROM_ADDRESS,
      subject: 'www.brandmenow.co.uk Order Confirmation',
      html: `  <table style="margin:50px auto 10px;background-color:white;border: 2px solid #858585;padding:50px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);-moz-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);     font-family: sans-serif; border-top: solid 10px #ff8800;">
    <thead>
      <tr> 
      <th style="text-align:left;"> 
      <img width="200" src="https://brandmenow.co.uk/cdn/shop/files/Brand_Me_Now_web_logo_1_360x.png" />
 </th>
        <th style="text-align:right;font-weight:400;"> ${new Date(newOrder.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="height:35px;"></td>
      </tr>
      <tr>
        <td colspan="2" style="border: solid 1px #ddd; padding:10px 20px;">
          <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:150px">Order status</span><b style="color:green;font-weight:normal;margin:0">Placed</b></p>
          <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Order ID</span> ${newOrder._id}</p>
          <p style="font-size:14px;margin:0 0 0 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Order amount</span> £ ${newOrder.totalAmount}</p>
          <p style="font-size:14px;margin:0 0 0 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Payment Mode</span> ${newOrder.mode}</p>
        </td>
      </tr>
      <tr>
        <td style="height:35px;"></td>
      </tr>
      <tr>
        <td  style="width:50%;padding:20px;vertical-align:top">
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px">Name</span> ${newOrder.details[0].username} </p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Email</span>  ${newOrder.details[0].email}  </p>
      
          
        </td>
        <td style="width:50%;padding:20px;vertical-align:top">
            <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Phone</span> +91-${newOrder.details[0].phone}</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Address</span> ${newOrder.details[0].address} </p>
           
          
        </td>
      </tr>
      
      <tr>
<td colspan="2" > 

<table class="table table-borderless" style="border-collapse: collapse; width: 100%;">
    <tbody>
    <tr>
        <td  style="padding: 10px;font-weight:bold;">Items</td>

        <td   style="padding: 10px;font-weight:bold;">Quantity</td>
             <td  style="padding: 10px;text-align:right;font-weight:bold;">Price</td>
      </tr>

      ${newOrder.items.map((Pro) => `
        <tr>
          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;" >
            <div className="d-flex mb-2">
              <div className="flex-shrink-0">
                <img
                  src="${Pro.image}"
                  alt=""
                  width="35"
                  className="img-fluid"
                />
              </div>
              <div className="flex-lg-grow-1 ms-3">
                <h6 className="small mb-0">
                  <a href="#" style="font-size:10px;">
                    ${Pro.title}  
                  </a>
                </h6>

              </div>
            </div>
          </td>

          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;"> ${Pro.quantity} </td>

          <td  style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;" >₹ ${Pro.price}</td>
        </tr>
        `).join('')}

    </tbody>
    <tfoot>
     
        <tr class="fw-bold">
            <td colspan="2" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;">TOTAL</td>
            <td colspan="2"  class="text-end" style="padding: .75rem; vertical-align: top; border-top: 1px solid #dee2e6;text-align: right;">₹${newOrder.totalAmount}</td>
        </tr>
    </tfoot>
</table>
</td>

      </tr>
    </tbody>
    <tfooter>
      <tr>
        <td colspan="2" style="font-size:14px;padding:50px 15px 0 15px;">
        
        
          <strong style="display:block;margin:0 0 10px 0;">Regards</strong> 
          
          <address><strong class="mb-2"> BRAND ME NOW </strong><br> 
          <b title="Phone" class="mb-2">Address:</b>Lindon House,
          <br>
          Heeley Road, 
          <br>
          Birmingham B29 6EN
          
          <br>
          <b title="Phone" class="mb-2">Email:</b> info@brandmenow.co.uk <br>
          <b title="Phone" class="mb-2">Web:</b>www.brandmenow.co.uk <br></address>
         
        </td>
      </tr>
    </tfooter>
  </table> `,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Transfer-Encoding': 'quoted-printable'
      }
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}


export const createOrderController = async (req, res) => {


  try {
    const { items, status, mode, details, totalAmount, userId } = req.body;
    //validation
    if (!status || !mode || !details || !totalAmount) {
      return res.status(400).send({
        success: false,
        message: "Please Provide ALl Fields",
      });
    }
    const exisitingUser = await userModel.findById(userId);
    //validaton
    if (!exisitingUser) {
      return res.status(404).send({
        success: false,
        message: "unable to find user",
      });
    }

    const lastOrder = await orderModel.findOne().sort({ orderId: -1 }).limit(1);
    let newOrderId = 1; // Default to 1 if no orders exist yet

    if (lastOrder) {
      newOrderId = lastOrder.orderId + 1;
    }

    const newOrder = new orderModel({
      items, status, mode, details, totalAmount, userId, orderId: newOrderId,
    });
    const session = await mongoose.startSession();
    session.startTransaction();
    await newOrder.save({ session });
    exisitingUser.orders.push(newOrder);
    await exisitingUser.save({ session });
    await session.commitTransaction();
    await newOrder.save();

    await sendOrderConfirmationEmail(email, username, userId, newOrder);

    return res.status(201).send({
      success: true,
      message: "Order Sucessfully!",
      newBlog,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error WHile Creting Order",
      error,
    });
  }
}


export const updateUserAndCreateOrderController = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, state, phone, pincode, userId, country, address, token, items, status, mode, details, totalAmount } = req.body;

    // Validation
    if (!status || !mode || !details || !totalAmount) {
      return res.status(400).send({
        success: false,
        message: "Please Provide All Fields",
      });
    }

    const existingUser = await userModel.findById(userId);
    // Validation
    if (!existingUser) {
      return res.status(404).send({
        success: false,
        message: "Unable to find user",
      });
    }

    // Construct line items array for the checkout session
    const lineItems = items.map((product) => ({
      price_data: {
        currency: "USD",
        product_data: {
          name: product.title,
          images: [product.image],
        },
        unit_amount: product.regularPrice * 100,
      },
      quantity: product.quantity
    }));

    // Create a checkout session with the line items
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "http://localhost:3000/cancel",
    });



    // Update user
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { phone, pincode, country, address, username, state },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }


    const lastOrder = await orderModel.findOne().sort({ orderId: -1 }).limit(1);
    let newOrderId = 1; // Default to 1 if no orders exist yet

    if (lastOrder) {
      newOrderId = lastOrder.orderId + 1;
    }

    // Create order for the updated user
    const newOrder = new orderModel({ items, status, mode, details, totalAmount, orderStatus: '0', transactionId: '', PaymentId: session.id, userId, orderId: newOrderId });

    await newOrder.save();
    await sendOrderConfirmationEmail(email, username, userId, newOrder);

    // Associate the order with the user
    updatedUser.orders.push(newOrder);
    await updatedUser.save();



    return res.json({ id: session.id });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const ordersucess = async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripeInstance.checkout.sessions.retrieve(session_id);
    console.log('Session retrieved:', session);

    if (session.payment_status === "paid") {
      const name = session.customer_details.name;
      const amount = session.amount_total / 100;
      const transactionID = session.payment_intent;
      const PaymentId = session.id;
      console.log('Payment successful:', name, amount, transactionID);
      const order = await orderModel.findOneAndUpdate(
        { PaymentId },
        { transactionID, orderStatus: '1', payment: 1 },
        { new: true }
      );
      console.log('orderorder', order)
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'User not found with the provided transaction ID',
        });
      } else {

        // Send response back to client
        res.status(200).json({ name, amount, transactionID });
      }

    } else {
      // Handle payment failure
      console.log('Payment failed');
      res.status(400).json({ error: 'Payment failed' });
    }
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const ordercancel = async (req, res) => {

  try {
    const { transactionId } = req.query;
    await updateOrderStatus(transactionId, 'failed');
    res.redirect('/cancel-page');
  } catch (error) {
    console.error('Error updating order status:', error);
    res.redirect('/error-page');
  }
};

export const updateProfileUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, phone, state, email, pincode, address, country, password } = req.body;

    if (!password) {


      if (!username || !email || !pincode || !address || !state) {
        return res.status(400).json({
          success: false,
          message: 'Please fill all fields',
        });
      }

      let updateFields = {
        username, email, pincode, address, state, country, phone
      };

      await userModel.findByIdAndUpdate(id, updateFields, {
        new: true,
      });

      return res.status(200).json({
        message: "Profile Updated!",
        success: true,
      });
    }
    else {
      const hashedPassword = await bcrypt.hash(password, 10);

      let updateFields = {
        password: hashedPassword
      };

      const user = await userModel.findByIdAndUpdate(id, updateFields, {
        new: true,
      });

      return res.status(200).json({
        message: "Password Updated!",
        success: true,
      });
    }


  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Promo code: ${error}`,
      success: false,
      error,
    });
  }
};


// for cancel order 

export const cancelOrderUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, reason } = req.body;

    let updateFields = {
      status: '0',
      comment,
      reason,
    };

    await orderModel.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    return res.status(200).json({
      message: "Order Cancel!",
      success: true,
    });


  } catch (error) {
    return res.status(400).json({
      message: `Error while updating Rating: ${error}`,
      success: false,
      error,
    });
  }
};

const updateOrderStatus = async (transactionId, status) => {
  await orderModel.updateOne({ transactionId }, { status });
};
export const orderCompleteUser = async (req, res) => {

  try {
    const { items, isEmpty, totalItems, totalUniqueItems, cartTotal } = req.body;

    const Cart = new cartModel({ items, isEmpty, totalItems, totalUniqueItems, cartTotal });
    await Cart.save();

    await order.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      Cart
    });
  } catch (error) {
    console.error('Error on signup:', error);
    res.status(500).json({
      success: false,
      message: 'Error on signup',
      error: error.message,
    });
  }


}



// Stripe webhoook

export const Stripewebhook = async (req, res) => {

  let data;
  let eventType;

  // Check if webhook signing is configured.
  let webhookSecret;
  webhookSecret = 'whsec_8a0e4702b4684eba0f61b61ca033be7d9988e867e8f1a53f40e7a70555734d3a';

  if (webhookSecret) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed:  ${err}`);
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data.object;
    eventType = event.type;
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data.object;
    eventType = req.body.type;
  }

  // Handle the checkout.session.completed event
  if (eventType === "checkout.session.completed") {
    stripe.customers
      .retrieve(data.customer)
      .then(async (customer) => {
        try {
          // CREATE ORDER
          orderCompleteUser(customer, data);
        } catch (err) {
          console.log(typeof orderCompleteUser);
          console.log(err);
        }
      })
      .catch((err) => console.log(err.message));
  }

  res.status(200).end();
}


// export const updateUserAndCreateOrderController = async (req, res) => {
//   let transactionInProgress = false;

//   const { id } = req.params;
//   const { phone, pincode, country, address, token, items, status, mode, details, totalAmount } = req.body;

//   const lineItems = items.map((product) => ({
//     price_data: {
//       currency: "GBP",
//       product_data: {
//         name: 'product.title',
//         images: 'product.image'
//       },
//       unit_amount: 200 * 100,
//     },
//     quantity: product.quantity
//   }));

//   console.log(lineItems)
//   console.log(items)
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ["card"],
//     line_items: lineItems,
//     mode: "payment",
//     success_url: "http://localhost:3000/success",
//     cancel_url: "http://localhost:3000/cancel",
//   });

//   res.json({ id: session.id });

//   // try {
//   //   session = await mongoose.startSession();
//   //   session.startTransaction();
//   //   transactionInProgress = true;

//   //   // Update user
//   //   const user = await userModel.findByIdAndUpdate(
//   //     id,
//   //     { phone, pincode, country, address, token },
//   //     { new: true }
//   //   );

//   //   if (!user) {
//   //     return res.status(404).json({
//   //       success: false,
//   //       message: 'User not found',
//   //     });
//   //   }

//   //   // Create order for the updated user
//   //   if (!status || !mode || !details || !totalAmount) {
//   //     return res.status(400).json({
//   //       success: false,
//   //       message: 'Please provide all fields for the order',
//   //     });
//   //   }

//   //   const newOrder = new orderModel({ items, status, mode, details, totalAmount });

//   //   await newOrder.save({ session });
//   //   user.orders.push(newOrder);
//   //   await user.save({ session });

//   //   await session.commitTransaction();
//   //   transactionInProgress = false;

//   //   return res.status(201).json({
//   //     success: true,
//   //     message: 'Order created successfully',
//   //     newOrder,
//   //     user
//   //   });
//   // } catch (error) {
//   //   if (transactionInProgress) {
//   //     try {
//   //       await session.abortTransaction();
//   //     } catch (abortError) {
//   //       console.error('Error aborting transaction:', abortError);
//   //     }
//   //   }
//   //   console.error('Error:', error);
//   //   return res.status(400).json({
//   //     success: false,
//   //     message: 'Error while creating order',
//   //     error: error.message,
//   //   });
//   // } finally {
//   //   if (session) {
//   //     session.endSession();
//   //   }
//   // }


// };


export const userOrdersController = async (req, res) => {
  try {
    const userOrder = await userModel.findById(req.params.id).populate('orders')
    if (!userOrder) {
      return res.status(200).send
        ({
          message: 'Order Not Found By user',
          success: false,
        });
    }
    return res.status(200).json({
      message: ' user Orders!',
      success: true,
      userOrder,
    });

  }
  catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error WHile Getting Orders",
      error,
    });
  }

}



export const AddCart = async (req, res) => {
  try {
    const { items, isEmpty, totalItems, totalUniqueItems, cartTotal } = req.body;

    const Cart = new cartModel({ items, isEmpty, totalItems, totalUniqueItems, cartTotal });
    await Cart.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      Cart
    });
  } catch (error) {
    console.error('Error on signup:', error);
    res.status(500).json({
      success: false,
      message: 'Error on signup',
      error: error.message,
    });
  }
}

export const UpdateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, isEmpty, totalItems, totalUniqueItems, cartTotal } = req.body;
    const Cart = await cartModel.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true })
    return res.status(200).json({
      message: 'Cart Updated!',
      success: true,
      Cart,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error while updating cart: ${error}`,
      success: false,
      error,
    });
  }
}


export const getCart = async (req, res) => {
  try {
    const { id } = req.params;
    const Cart = await cartModel.findById(id);
    if (!Cart) {
      return res.status(200).send
        ({
          message: 'Cart Not Found',
          success: false,
        });
    }
    return res.status(200).json({
      message: 'Cart Found successfully!',
      success: true,
      Cart,
    });

  }
  catch (error) {
    return res.status(400).json({
      message: `Error while get cart: ${error}`,
      success: false,
      error,
    });
  }
}




const sendOTP = async (email, otp, res) => {

  if (!email || !otp) {

    res.status(500).json({
      success: false,
      message: 'Error on otp Send',
      error: error.message,
    });
  } else {
    try {
      // Configure nodemailer transporter
      const transporter = nodemailer.createTransport({
        // SMTP configuration
        host: process.env.MAIL_HOST, // Update with your SMTP host
        port: process.env.MAIL_PORT, // Update with your SMTP port
        secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
        auth: {
          user: process.env.MAIL_USERNAME, // Update with your email address
          pass: process.env.MAIL_PASSWORD,// Update with your email password
        }
      });

      // Email message
      const mailOptions = {
        from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
        to: email, // Update with your email address
        subject: 'Brandnow Email Verification',
        html: `<h3>OTP: <b>${otp}</b></h3>` // HTML body with OTP in bold
      };

      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('error sent successfully', error);

          res.status(500).json({
            success: false,
            message: 'Error on otp Send',
            error: error.message,
          });

        } else {
          res.status(200).send('OTP sent successfully');
          console.log('OTP sent successfully');

        }
      });

    } catch (error) {
      // Handle errors
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP');
    }
  }

};



export const SendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // Send OTP via Phone
    await sendOTP(email, otp);

    res.status(200).json({ success: true, message: 'OTP sent successfully', OTP: otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};



export const SignupLoginUser = async (req, res) => {
  try {
    const { email, Gtoken } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // // Send OTP via Phone


    if (!Gtoken) {
      return res.status(400).json({
        success: false,
        message: 'you can access this page ',
      });
    }

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all fields',
      });
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {


      if (existingUser.password !== undefined) {
        if (existingUser.status === '0') {
          return res.status(400).json({
            success: false,
            message: 'An error occurred. Please contact support.',
          });
        }
        return res.status(201).json({
          success: true,
          message: 'User found with password',
          password: true,
        });
      } else {

        try {
          // Configure nodemailer transporter
          const transporter = nodemailer.createTransport({
            // SMTP configuration
            host: process.env.MAIL_HOST, // Update with your SMTP host
            port: process.env.MAIL_PORT, // Update with your SMTP port
            secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
            auth: {
              user: process.env.MAIL_USERNAME, // Update with your email address
              pass: process.env.MAIL_PASSWORD,// Update with your email password
            }
          });

          // Email message
          const mailOptions = {
            from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
            to: email, // Update with your email address
            subject: 'Brandnow Email Verification',
            html: `<h3>OTP: <b>${otp}</b></h3>` // HTML body with OTP in bold
          };

          // Send email
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('error sent successfully', error);

              res.status(500).json({
                success: false,
                message: 'Error on otp Send',
                error: error.message,
              });

            } else {
              res.status(200).send('OTP sent successfully');
              console.log('OTP sent successfully');

            }
          });

        } catch (error) {
          // Handle errors
          console.error('Error sending OTP:', error);
          throw new Error('Failed to send OTP');
        }

        if (existingUser.status === '0') {
          return res.status(400).json({
            success: false,
            message: 'An error occurred. Please contact support.',
          });
        }
        return res.status(201).json({
          success: true,
          message: 'User found',
          existingUser: { _id: existingUser._id, username: existingUser.username, phone: existingUser.phone, email: existingUser.email },
          token: existingUser.token,
          otp: otp,
        });
      }
    } else {
      return res.status(200).json({
        success: true,
        message: 'New User found',
        newUser: true,
        otp: otp,
      });
    }
  } catch (error) {
    console.error('Error on login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error on login',
      error: error.message,
    });
  }
}


export const contactEnquire = async (req, res) => {

  const { name, email, message } = req.body;

  // Configure nodemailer transporter
  const transporter = nodemailer.createTransport({
    // SMTP configuration
    host: process.env.MAIL_HOST, // Update with your SMTP host
    port: process.env.MAIL_PORT, // Update with your SMTP port
    secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
    auth: {
      user: process.env.MAIL_USERNAME, // Update with your email address
      pass: process.env.MAIL_PASSWORD,// Update with your email password
    }
  });

  // Email message
  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
    to: process.env.MAIL_TO_ADDRESS, // Update with your email address
    subject: 'New Contact Us Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send('Failed to send email');
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).send('Email sent successfully');
    }
  });

};

export const SignupNewUser = async (req, res) => {
  try {
    const { email, Gtoken } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // // Send OTP via Phone
    await sendOTP(email, otp);


    if (!Gtoken) {
      return res.status(400).json({
        success: false,
        message: 'you can access this page ',
      });
    }
    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all fields',
      });
    }

    const lastUser = await userModel.findOne().sort({ _id: -1 }).limit(1);

    let lastUserId = 0;

    if (lastUser && typeof lastUser.u_id === 'number') {
      // If u_id is already a number, use it directly
      lastUserId = lastUser.u_id;
    } else if (lastUser && typeof lastUser.u_id === 'string') {
      // Try to parse u_id from string to number
      const parsedId = parseFloat(lastUser.u_id);
      if (!isNaN(parsedId)) {
        lastUserId = parsedId;
      } else {
        console.error('Invalid u_id value:', lastUser.u_id);
      }
    }

    // Calculate the auto-increment ID
    const u_id = lastUserId + 1;

    // Create a new user
    const user = new userModel({ email, u_id });
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
    user.token = token; // Update the user's token field with the generated token
    await user.save();

    // Generate JWT token

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      existingUser: { _id: user._id, username: user.username, phone: user.phone, email: user.email },
      otp: otp,
      token,
    });
  } catch (error) {
    console.error('Error on signup:', error);
    res.status(500).json({
      success: false,
      message: 'Error on signup',
      error: error.message,
    });
  }
}


export const LoginUserWithOTP = async (req, res) => {
  try {
    const { email, Gtoken } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    // // Send OTP via Phone
    await sendOTP(email, otp);

    if (!Gtoken) {
      return res.status(400).json({
        success: false,
        message: 'you can access this page ',
      });
    }


    // // Send OTP via Phone
    try {
      // Configure nodemailer transporter
      const transporter = nodemailer.createTransport({
        // SMTP configuration
        host: process.env.MAIL_HOST, // Update with your SMTP host
        port: process.env.MAIL_PORT, // Update with your SMTP port
        secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
        auth: {
          user: process.env.MAIL_USERNAME, // Update with your email address
          pass: process.env.MAIL_PASSWORD,// Update with your email password
        }
      });

      // Email message
      const mailOptions = {
        from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
        to: email, // Update with your email address
        subject: 'Brandnow Email Verification',
        html: `<h3>OTP: <b>${otp}</b></h3>` // HTML body with OTP in bold
      };

      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('error sent successfully', error);

          res.status(500).json({
            success: false,
            message: 'Error on otp Send',
            error: error.message,
          });

        } else {
          res.status(200).send('OTP sent successfully');
          console.log('OTP sent successfully');

        }
      });

    } catch (error) {
      // Handle errors
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP');
    }


    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(201).json({
        success: true,
        message: 'User found',
        existingUser: { _id: existingUser._id, username: existingUser.username, phone: existingUser.phone, email: existingUser.email },
        token: existingUser.token,
        otp: otp,
      });

    }
  } catch (error) {
    console.error('Error on signup:', error);
    res.status(500).json({
      success: false,
      message: 'Error on signup',
      error: error.message,
    });
  }
}


export const LoginUserWithPass = async (req, res) => {

  try {
    const { email, Gtoken, password } = req.body;

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    if (!email || !password || !Gtoken) {
      return res.status(400).send({
        success: false,
        message: 'please fill all fields'
      })
    }
    const user = await userModel.findOne({ email })

    // password check

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: 'password is not incorrect',
        user,
      });
    }

    // const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

    return res.status(200).json({
      success: true,
      message: 'login sucesssfully with password',
      existingUser: { _id: user._id, username: user.username, phone: user.phone, email: user.email },
      token: user.token,
      checkpass: true,
    });


  } catch (error) {
    return res.status(500).send
      ({
        message: `error on login ${error}`,
        sucesss: false,
        error
      })
  }

}


export const Newsletter = async (req, res) => {

  const { email } = req.body;

  if (!email) {

    res.status(500).json({
      success: false,
      message: 'Error on otp Send',
      error: error.message,
    });
  } else {
    try {
      // Configure nodemailer transporter
      const transporter = nodemailer.createTransport({
        // SMTP configuration
        host: process.env.MAIL_HOST, // Update with your SMTP host
        port: process.env.MAIL_PORT, // Update with your SMTP port
        secure: process.env.MAIL_ENCRYPTION, // Set to true if using SSL/TLS
        auth: {
          user: process.env.MAIL_USERNAME, // Update with your email address
          pass: process.env.MAIL_PASSWORD,// Update with your email password
        }
      });

      // Email message
      const mailOptions = {
        from: process.env.MAIL_FROM_ADDRESS, // Update with your email address
        to: process.env.MAIL_TO_ADDRESS, // Update with your email address
        subject: 'Brandnow Email Verification',
        html: `<h3>Email: <b>${email}</b></h3>` // HTML body with OTP in bold
      };

      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('error on newsLetter subscribe', error);

          res.status(500).json({
            success: false,
            message: 'error on newsLetter subscribe',
            error: error.message,
          });

        } else {
          res.status(200).send('NewsLetter Subscribe Successfully!');
          console.log('NewsLetter Subscribe Successfully!');

        }
      });

    } catch (error) {
      // Handle errors
      console.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP');
    }
  }

};



export const AuthUserByID = async (req, res) => {

  try {
    const { id, token } = req.body;

    const existingUser = await userModel.findById(id);

    if (existingUser) {
      if (existingUser.token === token) {

        return res.status(200).json({
          success: true,
          message: 'login sucesssfully with password',
          existingUser: {
            _id: existingUser._id, username: existingUser.username, phone: existingUser.phone, email: existingUser.email,
            address: existingUser.address, pincode: existingUser.pincode, state: existingUser.state, country: existingUser.country,
          },
        });


      } else {
        return res.status(401).send({
          success: false,
          message: 'token is not incorrect',
        });
      }
    } else {
      return res.status(401).send({
        success: false,
        message: 'user Not found',
      });
    }

  } catch (error) {
    return res.status(500).send
      ({
        message: `error on Auth ${error}`,
        sucesss: false,
        error
      })
  }

}
