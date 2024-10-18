import express from "express";
import {
    SignupAdmin, Adminlogin, getAllGalleryController, deleteGalleryController, AddAdminBlogController, AdmindeleteBlogController, AddAdminCategoryController
    , deleteAllProductAdmin, AdmingetAllCategories, AddAdminProduct, getAllcategoryFillAdmin, updateCategoryAdmin, getCategoryIdAdmin, deleteCategoryAdmin, getAllProductFillAdmin, updateProductAdmin, getProductIdAdmin, deleteProductAdmin,
    importAllUserAdmin, GetImageAdmin, AddAdminFolderController, GetFolderAdmin, GetFolderIDAdmin, UpdateFolderAdmin, deleteFolderAdmin, editOrderAdmin, editHomeLayoutData, getAllOrderAdmin, exportAllProAdmin, importAllProAdmin, AdmindeleteOrderController, getAllUserAdmin, GetAllCategoriesByuserController, editUserAdmin, getUserIdAdmin, AddAdminPrivateProductController, getAllPrivateProductFillAdmin, updatePrivateProductAdmin, getPrivateProductIdAdmin, deletePrivateProductAdmin, AddAdminPrivateStoreController, deletePrivateStoreAdmin, getAllPrivateStoreFillAdmin, updatePrivateStoreAdmin, getPrivateStoreIdAdmin, AddAdminAttributeController, editHomeData, getAllAttributeFillAdmin, updateAttributeAdmin, getAttributeIdAdmin, deleteAttributeAdmin, getAllAttribute, AddAdminTagController, getAllTagFillAdmin, updateTagAdmin, getTagIdAdmin, deleteTagAdmin, getAllTag, handleCusImageUpload, exportAllUserAdmin
    , editDetailOrderAdmin, AddAdminPageController, getAllPageAdmin, updatePageAdmin, getPageIdAdmin, deletePageAdmin
} from "../controller/adminController.js";
import {
    AddCart, UpdateCart, getCart, userTokenController, userBlogsController, Userlogin, SignupUser, getAllBlogsController, createBlogController,
    updateBlogController, deleteBlogController, getBlogIdController, CreateChatController, findUserschatController, findchatController
    ,Newsletter , GetAllCategoriesByParentIdController, updateProfileUser, cancelOrderUser, userOrdersViewController, getPrivateProductIdUser, AuthUserByID, contactEnquire, UsergetAllHomeProducts, getHomeLayoutData, SendOTP, ordercancel, ordersucess, SignupLoginUser, LoginUserWithPass, LoginUserWithOTP, SignupNewUser, getCollectionProductIdUser, UsergetAllPrivateProducts, UsergetAllCategories, UsergetAllProducts, getAllAttributeUser, getHomeData, getProductIdUser, updateUserController, createOrderController, updateUserAndCreateOrderController, userOrdersController

} from "../controller/userController.js"
import authenticateToken from "../middleware/authMiddleware.js";
import { uploadImage, handleImageUpload } from "../controller/adminController.js";

const router = express.Router();

// admin routes
router.post('/adminsignup', SignupAdmin);
router.post('/admin', Adminlogin);
router.post('/admin/upload-img', uploadImage, handleImageUpload);
router.post('/upload-img-custom', uploadImage, handleCusImageUpload);

router.get('/admin/allgallery', getAllGalleryController);
router.delete('/admin/delete-gallery/:id', deleteGalleryController);

router.post('/admin/addBlog', AddAdminBlogController);
router.post('/admin/update-blog/:id', AddAdminBlogController);
router.delete('/admin/delete-blog/:id', AdmindeleteBlogController);

router.post('/admin/add-category', AddAdminCategoryController);
router.get('/admin/category/:parentId', GetAllCategoriesByParentIdController);
router.get('/all-category', UsergetAllCategories);
router.get('/all-product', UsergetAllProducts);
router.get('/all-products', UsergetAllProducts);
router.post('/contact-enquire/', contactEnquire);

router.put('/cancel-order/:id', cancelOrderUser);


router.get('/all-privateproduct', UsergetAllPrivateProducts);
router.get('/admin/all-category-fillter', getAllcategoryFillAdmin);
router.get('/admin/get-category/:id', getCategoryIdAdmin);
router.put('/admin/update-category/:id', updateCategoryAdmin);
router.delete('/admin/delete-category/:id', deleteCategoryAdmin);
router.get('/all/category/:parentId', GetAllCategoriesByuserController);

router.post('/admin/add-product', AddAdminProduct);
router.get('/admin/all-product-fillter', getAllProductFillAdmin);
router.get('/admin/get-product/:id', getProductIdAdmin);
router.put('/admin/update-product/:id', updateProductAdmin);
router.delete('/admin/delete-product/:id', deleteProductAdmin);
router.get('/admin/delete-all-product/', deleteAllProductAdmin);



router.post('/admin/add-attribute', AddAdminAttributeController);
router.get('/admin/all-attribute-fillter', getAllAttributeFillAdmin);
router.get('/admin/get-attribute/:id', getAttributeIdAdmin);
router.put('/admin/update-attribute/:id', updateAttributeAdmin);
router.delete('/admin/delete-attribute/:id', deleteAttributeAdmin);
router.get('/admin/all-attribute', getAllAttribute);


router.post('/admin/add-tag', AddAdminTagController);
router.get('/admin/all-tag-fillter', getAllTagFillAdmin);
router.get('/admin/get-tag/:id', getTagIdAdmin);
router.put('/admin/update-tag/:id', updateTagAdmin);
router.delete('/admin/delete-tag/:id', deleteTagAdmin);
router.get('/admin/all-tag', getAllTag);

// home settings Admin
router.put('/admin/edit-home', editHomeData);
// home layout settings Admin

router.put('/admin/edit-home-layout', editHomeLayoutData);



// for page 

router.post('/admin/add-page', AddAdminPageController);
router.get('/admin/all-page', getAllPageAdmin);
router.get('/admin/get-page/:id', getPageIdAdmin);
router.put('/admin/update-page/:id', updatePageAdmin);
router.delete('/admin/delete-page/:id', deletePageAdmin);



// for private Store 

router.post('/admin/create-privatestore', AddAdminPrivateStoreController);
router.put('/admin/update-privatestore/:id', updatePrivateStoreAdmin);
router.get('/admin/get-privatestore/:id', getPrivateStoreIdAdmin);
router.get('/admin/all-privatestore/', getAllPrivateStoreFillAdmin);
router.delete('/admin/delete-privatestore/:id', deletePrivateStoreAdmin);

// for private product

router.post('/admin/create-privateproduct', AddAdminPrivateProductController);
router.put('/admin/update-privateproduct/:id', updatePrivateProductAdmin);
router.get('/admin/get-privateproduct/:id', getPrivateProductIdAdmin);
router.get('/admin/all-privateproduct/', getAllPrivateProductFillAdmin);
router.delete('/admin/delete-privateproduct/:id', deletePrivateProductAdmin);

// order Admin

router.get('/admin/all-order', getAllOrderAdmin);
router.put('/admin/update-order/:id', editOrderAdmin);
router.delete('/admin/delete-order/:id', AdmindeleteOrderController);
router.put('/admin/edit-order/:id', editDetailOrderAdmin);


// for gellary
router.get('/admin/get-image', GetImageAdmin);


// Folder Admin 


router.post('/admin/add-folder', AddAdminFolderController);
router.get('/admin/get-folder', GetFolderAdmin);
router.get('/admin/get-folder/:id', GetFolderIDAdmin);
router.put('/admin/update-folder/:id', UpdateFolderAdmin);
router.delete('/admin/delete-folder/:id', deleteFolderAdmin);

// for export admin

router.get('/admin/export/allproducts/', exportAllProAdmin);
router.post('/admin/import/allproducts/', importAllProAdmin);

// for user export admin
router.get('/admin/export/allusers/', exportAllUserAdmin);
router.post('/admin/import/allUser/', importAllUserAdmin);

// user Admin

router.get('/admin/all-user', getAllUserAdmin);
router.put('/admin/update-user/:id', editUserAdmin);
router.get('/admin/get-user/:id', getUserIdAdmin);

// user routes
router.get('/home-layout-data', getHomeLayoutData);

router.post('/signup', SignupUser);
router.post('/login', Userlogin);
router.get('/all-home-products', UsergetAllHomeProducts);

//router.post('/create-order', createOrderController);
router.post('/create-order/:id', updateUserAndCreateOrderController);
router.get('/user-orders/:id', userOrdersController);

router.post('/add-cart', AddCart);
router.get('/get-cart/:id', getCart);
router.put('/update-cart/:id', UpdateCart);


router.get('/all-blogs', getAllBlogsController);
router.get('/success', ordersucess);

router.get('/cancel', ordercancel);
router.put('/update-profile/:id', updateProfileUser);



router.put('/update-user/:id', updateUserController);


router.post('/create-blog', createBlogController);
router.put('/update-blog/:id', updateBlogController);
router.get('/get-blog/:id', getBlogIdController);
router.delete('/delete-blog/:id', deleteBlogController);

router.post('/create-chat', CreateChatController);
router.get('/find-chats/:id', findUserschatController);
router.get('/find-chat/:firstId/:secondId', findchatController);

router.post('/auth-user/', AuthUserByID);


router.post('/send-otp/', SendOTP);

router.post('/signup-login-otp/', SignupLoginUser);

router.post('/login-with-pass/', LoginUserWithPass);

router.post('/login-with-otp/', LoginUserWithOTP);

router.post('/signup-new-user/', SignupNewUser);

router.get('/user-orders-view/:userId/:orderId', userOrdersViewController);

// get blog by user 
router.get('/validatetoken/:id', userTokenController);

router.get('/user-blogs/:id', userBlogsController);

router.get('/user-product/:id', getProductIdUser);

router.get('/user-private-product/:id', getPrivateProductIdUser);

router.get('/user-private-product/:storeid/:id', getCollectionProductIdUser);


router.get('/all-attribute', getAllAttributeUser);

// home settings user
router.get('/home-data', getHomeData);

router.post('/news-letter', Newsletter);



export default router;

