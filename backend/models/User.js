  import mongoose from "mongoose";

  const UserSchema  =  mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String
    },
    password: {
      type: String,
      required: true
    }
  },{timeStamps:true});

  const User =  mongoose.model("User",UserSchema);
  export default User;