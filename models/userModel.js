import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  u_id: {
    type: Number,
    require: [true, "product id is required"],
    unique: true
  },
  username: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true
  },
  password: {
    type: String,
  }, token: {
    type: String,
  }, phone: {
    type: String,
  }, pincode: {
    type: String,
  }, state: {
    type: String,
  },
  country: {
    type: String,
  },
  address: {
    type: String,
  },
  userId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },],
  status: {
    type: String,
    default: 1,
  },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
  ],
},
  { timestamps: true }
);

const userModel = mongoose.model('User', userSchema);

export default userModel;