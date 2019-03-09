const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bycrypt = require('bcryptjs');
const _ = require('lodash');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        index: true,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: props => `${props.value} is not a valid email!`
        }

    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

const secret = 'abc123';

UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function () {
    const user = this;
    const access = 'auth';
    const token = jwt.sign({_id: user._id.toHexString(), access}, secret).toString();
    
    user.tokens = user.tokens.concat([{access, token}]);

    return user.save().then(()=>{
        return token;
    });
}

UserSchema.statics.findByToken = function (token) {
    const User = this;
    let decoded;

    try {
        decoded = jwt.verify(token, secret);
    } catch (error) {
        return Promise.reject();
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

UserSchema.pre('save', function(next){
    const user = this;
    if(user.isModified('password')){
        bycrypt.genSalt(10, (err, salt) => {
            bycrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    }else {
        next();
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = { User };