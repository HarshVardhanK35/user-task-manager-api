const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
    description: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      required: true,
      validate(value){
        if(typeof value !== 'boolean'){
          throw new Error('"Completed" must be a boolean value')
        }
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    createdAt:{
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
},{
    timestamps: true
  }
)
const Task = mongoose.model('Task', taskSchema)
module.exports = Task;