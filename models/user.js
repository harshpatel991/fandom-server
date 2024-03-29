var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    local: {
        email		: String,
        password	: String
    },
    favorites: { type: [Number], default: []},
    comments_upvoted: { type: [mongoose.Schema.Types.Mixed], default: []},
    comments_downvoted: { type: [mongoose.Schema.Types.Mixed], default: []},
    episodes_ratings: [{ type: mongoose.Schema.Types.Mixed}]
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);