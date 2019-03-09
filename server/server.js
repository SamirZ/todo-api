const env = process.env.NODE_ENV;

if(!process.env.MONGODB_URI){
    const protocol = "mongodb://";
    const url = "localhost:"
    const port = "27017";

    const dbName = "/todoapp";
    const testDbName = "/todoapptest";
    
    if(env === 'dev'){
        process.env.PORT = 3000;
        process.env.MONGODB_URI = protocol + url + port + dbName;
    } else if(env === 'test'){
        process.env.PORT = 3000;
        process.env.MONGODB_URI = protocol + url + port + testDbName;
    }
}

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

const { mongoose } = require("./db/mongoose");

const { User, Todo } = require("./models");

const app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    const todo = new Todo({
        text: req.body.text
    });

    todo.save()
        .then(doc => res.status(201).send(doc))
        .catch(e => res.status(400).send(e));
});

app.get('/todos', (req, res) => {
    Todo.find()
        .then(todos => res.send({todos }))
        .catch(e => res.status(400).send(e));
})

app.get('/todos/:id', (req, res) => {

    const id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(400).send();
    }

    Todo.findById(id)
        .then(todo => {
            if(!todo) {
                return res.status(404).send();
            }
            res.send({todo});
        })
        .catch(e => res.status(400).send(e));
});

app.delete('/todos/:id', (req, res) => {

    const id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(400).send();
    }

    Todo.findByIdAndDelete(id)
        .then(todo => {
            if(!todo) {
                return res.status(404).send();
            }
            res.send({todo});
        })
        .catch(e => res.status(400).send(e));
});

app.patch('/todos/:id', (req, res) => {

    const id = req.params.id;
    const body = _.pick(req.body, ['text', 'completed']);

    if(!ObjectID.isValid(id)){
        return res.status(400).send();
    }

    if(_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    }else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findByIdAndUpdate(
        id, 
        {$set: body},
        {new: true}
    )
        .then(todo => {
            if(!todo) {
                return res.status(404).send();
            }
            res.send({todo});
        })
        .catch(e => res.status(400).send(e));
});

app.post('/users', (req, res) => {

    const body = _.pick(req.body, ['email', 'password']);

    const user = new User(body);

    user.save()
        .then(() => {
            return user.generateAuthToken();
        })
        .then((token) => {
            res.header('x-auth', token).status(201).send(user)
        })
        .catch(e => res.status(400).send(e));
});

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}.`);
})

module.exports = { app };

