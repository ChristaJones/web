const user = require('./users');
function Model(db) {
	          this.user = new user.User(db);
}
module.exports = {
	Model: Model
};
