const express = require('express');
const router = new express.Router();

// add validation library
const { check, validationResult } = require('express-validator')

// auth-middleware
const auth = require("../middleware/auth")

// import Task schema
const Task = require('../models/task')

// create new task
router.post('/tasks', auth,
[
  check('description').isString().withMessage("Description must be a String"),
  check('completed').isBoolean().withMessage("Completed must be a Boolean")
],
async (req, res) => {
  const errors = validationResult(req)

  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() })
  }

  // const task = new Task(req.body);      // before modification
  const task = new Task ({
    ...req.body,
    createdBy: req.user._id               // the person we just authenticated
  })                                      // after modification
  try{
    task.save()
    res.status(201).send(task)
  }
  catch(err) {
    res.status(400).send(err)
  }
})

// GET-tasks: /tasks
// GET-filtered tasks: /tasks?completed=false with filtered data ----------
// pagination /tasks?limit=10&skip=0 ----------
// sorting data /tasks?createdAt_asc (or) /tasks?createdAt_desc likewise for updatedAt too ----------
router.get('/tasks', auth, async (req, res) => {
  if (req.query.completed !== 'true' && req.query.completed !== 'false' && req.query.completed !== undefined) {
    return res.status(400).send("Bad Request: 'completed' query parameter must be 'true' or 'false'");
  }
  const limit = parseInt(req.query.limit) || 5;
  const skip = parseInt(req.query.skip) || 0;
  const match = {};
  if (req.query.completed !== undefined) {
    match.completed = (req.query.completed === 'true') ? true : false
  }
  const sort = {};
  if (req.query.sortBy) {
    const urlParts = req.query.sortBy.split('_')
    sort[urlParts[0]] = urlParts[1] === 'asc' ? 1 : -1
  }
  try {
    const tasks = await Task.find(
      req.query.completed ?
      { ...match, createdBy: req.user._id } : { createdBy: req.user._id }
    )
    .limit(limit)
    .skip(skip)
    .sort(sort)
    res.send(tasks);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});

// get a specific task use it's id
router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;
  try{
    const task = await Task.findOne({ _id, createdBy: req.user._id })
    if(!task){
      return res.status(404).send("Task not found!")
    }
    res.send(task)
  }
  catch(err) {
    res.status(500).send(err)
  }
})

// updating a single user with Id
router.patch('/tasks/:id',auth, async (req, res) => {
  const reqBodyUpdates = Object.keys(req.body);
  const updatesAllowed = ['description', 'completed'];
  const isValidOperation = reqBodyUpdates.every((reqBodyUpdate) => {
    return updatesAllowed.includes(reqBodyUpdate)
  })
  if(!isValidOperation) {
    res.status(400).send({ error: "Invalid updates!" })
  }
  try{
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user._id })      // after modification
    // const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })
     if(!task){
      res.status(404).send("Task not found!")
    }
    reqBodyUpdates.forEach((update) => {
      task[update] = req.body[update]
    })
    await task.save()
    res.send(task)
  }
  catch(err){
    res.status(400).send(err)
  }
})

// delete a task with Id
router.delete('/tasks/:id', auth, async(req, res) => {
    try{
      const task = await Task.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id })
      if(!task){
        return res.status(404).send("Task not found!")
      }
      res.send(task)
    }
    catch(err){
      res.status(500).send(err)
    }
})

module.exports = router