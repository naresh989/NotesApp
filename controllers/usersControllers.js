const User = require('../models/Users')
const  Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')


// get all Users
// access private

const getAllUsers =asyncHandler( async (req,res) =>{
    const users = await User.find().select('-password').lean()
    if(!users?.length){
        return res.status(400).json({message:"no users found"})
    }
    res.json(users)
})
const createNewUser =asyncHandler( async (req,res) =>{
 const {username, password,roles} = req.body
 if(!username || !password || !Array.isArray(roles) || !roles.length)
 {
    return res.status(400).json({message:"all fields are required"})
 }  

//  check for duplicate

const duplicate = await User.findOne({username}).lean().exec()
if(duplicate)
{
    return res.status(409).json({message:"duplicate user name"})
}

const hashedPwd = await bcrypt.hash(password,10)
const userObject = {username , "password":hashedPwd , roles}

const user  = await User.create(userObject)

if(user)
{
    res.status(201).json({message : `New User ${username} created`})
}
else{
    res.status(400).json({message:'invalid user data received'})
}

})

const updateUser =asyncHandler( async (req,res) =>{
    const {id,username,roles,active,password}=req.body
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean'){
        return res.status(400).json({message:"all fields are required"})
    }

    const user = await User.findById(id).exec()

    if(!user?.length){
        return res.status(400).json({message:"user not found"})
    }

    // check for duplicate
    
const duplicate = await User.findOne({username}).lean().exec()
if(duplicate && duplicate?._id.toString() !== id)
{
    return res.status(409).json({message:"duplicate user name"})
}
user.username = username
user.roles=roles
user.active = active
if(password){
    user.password = await bcrypt.hash(password,10)
}
const updateduser = user.save();
res.json({message:`${updateduser.username} updated`})

})


const deleteUser =asyncHandler( async (req,res) =>{
  const {id} = req.body

  if(!id){
    return res.status(400).json({message : "User ID changed"})
  }
  const notes = await Note.findOne({user :id}).lean().exec()
  if(notes){
    return res.status(400).json({message:'user has assigned notes'})
  }
  const user = await User.findById(id).exec();
  if(!user)
  {
    return res.status(400).json({message:"user not found"})
  }
   const result = await user.deleteOne()
   const reply = `Username ${result.username} with ID ${result.id} deleted`
   res.json(reply)


})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}