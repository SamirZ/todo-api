const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('./../server');
const { Todo } = require('./../models');

const initialTodos = [
    {
        _id: new ObjectID(),
        text: 'First test todo'
    },
    {
        _id: new ObjectID(),
        text: 'Second test todo',
        completed: true,
        completedAt: 333
    }
];

beforeEach((done)=> {
    Todo.deleteMany({}).then(()=>{
        return Todo.insertMany(initialTodos);
    }). then(() => done());
});

describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        const text = 'Test todo text';

        request(app)
            .post('/todos')
            .send({ text })
            .expect(201)
            .expect((res)=>{
                expect(res.body.text).toBe(text);
            })
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                Todo.find({text}).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch(e => done(e));
            });
    });

    it('should not create a new todo with invalid data', (done) => {
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if(err){
                    return done(err);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(initialTodos.length);
                    done();
                }).catch(e => done(e));
            });
    });
} );

describe('GET /todos', () => {
    it('should get all todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect((res)=>{
                expect(res.body.todos.length).toBe(initialTodos.length);
            })
            .end(done);
    });
});

describe('GET /todos/:id', () => {
    it('should return todo doc', (done) => {
        request(app)
            .get(`/todos/${initialTodos[0]._id.toHexString()}`)
            .expect(200)
            .expect((res)=>{
                expect(res.body.todo.text).toBe(initialTodos[0].text);
            })
            .end(done);
    });

    it('should return 404 if todo not found', (done) => {
        request(app)
            .get(`/todos/${new ObjectID()._id.toHexString()}`)
            .expect(404)
            .end(done);
    });

    it('should return 400 for non object ids', (done) => {
        request(app)
            .get(`/todos/123`)
            .expect(400)
            .end(done);
    });
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo', (done) => {
        request(app)
            .delete(`/todos/${initialTodos[0]._id.toHexString()}`)
            .expect(200)
            .expect((res)=>{
                expect(res.body.todo._id).toBe(initialTodos[0]._id.toHexString());
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }
                Todo.findById(initialTodos[0]._id.toHexString())
                .then((todo) => {
                    expect(todo).toBeFalsy();
                    done();
                }).catch(e => done(e));
            });
    });

    it('should return 404 if todo not found', (done) => {
        request(app)
            .get(`/todos/${new ObjectID()._id.toHexString()}`)
            .expect(404)
            .end(done);
    });

    it('should return 400 if object id is invalid', (done) => {
        request(app)
            .get(`/todos/123`)
            .expect(400)
            .end(done);
    });

});

describe('PATCH /todos/:id', () => {
    it('should update the todo', (done) => {

        const text = 'The new text';
        request(app)
            .patch(`/todos/${initialTodos[0]._id.toHexString()}`)
            .send({ text, completed: true })
            .expect(200)
            .expect((res)=>{
                expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(true);
                expect(res.body.todo.completedAt).toBeGreaterThan(0);
            })
            .end(done);
    });

    it('should clear compleatedAt when todo is not completed', (done) => {
        const text = 'The new text!!';
        request(app)
            .patch(`/todos/${initialTodos[1]._id.toHexString()}`)
            .send({ text, completed: false })
            .expect(200)
            .expect((res)=>{
                expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(false);
                expect(res.body.todo.completedAt).toBeFalsy();
            })
            .end(done);
    });

});